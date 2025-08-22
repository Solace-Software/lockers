#!/bin/bash

# Gym Lockers Deployment Script
# Usage: ./deploy.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
FORCE_REBUILD=false
BACKUP=true
VERBOSE=false
DRY_RUN=false

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Gym Lockers Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
    local       Deploy locally with Docker Compose
    staging     Deploy to staging server
    production  Deploy to production server

OPTIONS:
    -f, --force-rebuild    Force rebuild of Docker images
    -b, --no-backup       Skip backup before deployment
    -v, --verbose         Enable verbose output
    -d, --dry-run         Show what would be done without executing
    -h, --help            Show this help message

EXAMPLES:
    $0 local                          # Deploy locally
    $0 staging --force-rebuild        # Deploy to staging with rebuild
    $0 production --no-backup         # Deploy to production without backup
    $0 staging --dry-run              # Show staging deployment plan

ENVIRONMENT VARIABLES:
    SERVER_HOST              Production server hostname/IP
    SERVER_USER              SSH username for production
    STAGING_SERVER_HOST      Staging server hostname/IP
    STAGING_SERVER_USER      SSH username for staging
    DB_ROOT_PASSWORD         Database root password
    DB_PASSWORD              Application database password
    MQTT_USERNAME            MQTT broker username
    MQTT_PASSWORD            MQTT broker password
    DOMAIN                   Production domain name

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            local|staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            -f|--force-rebuild)
                FORCE_REBUILD=true
                shift
                ;;
            -b|--no-backup)
                BACKUP=false
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                set -x
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required"
        show_help
        exit 1
    fi
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi

    # Environment-specific checks
    case $ENVIRONMENT in
        staging|production)
            if ! command -v ssh &> /dev/null; then
                log_error "SSH is not installed"
                exit 1
            fi
            ;;
    esac

    log_success "Prerequisites check passed"
}

deploy_local() {
    log_info "Starting local deployment..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would execute local deployment"
        return 0
    fi

    # Stop existing services
    log_info "Stopping existing services..."
    (docker compose --profile dev down || docker-compose --profile dev down) || true

    # Build and start services
    local build_flag=""
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        build_flag="--build"
    fi

    log_info "Starting local development environment..."
    (docker compose --profile dev up -d $build_flag || docker-compose --profile dev up -d $build_flag)

    # Wait for services
    log_info "Waiting for services to be ready..."
    sleep 10

    # Health check
    log_info "Running health checks..."
    (docker compose --profile dev ps || docker-compose --profile dev ps)

    if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
        log_success "Backend API is responding"
    else
        log_warning "Backend API not responding"
    fi

    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is responding"
    else
        log_warning "Frontend not responding"
    fi

    log_success "Local deployment completed!"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend API: http://localhost:3001"
}

deploy_remote() {
    local env=$1
    log_info "Starting $env deployment..."

    # Set environment-specific variables
    local server_host=""
    local server_user=""
    local deploy_path=""
    local ports=""

    case $env in
        staging)
            server_host="${STAGING_SERVER_HOST}"
            server_user="${STAGING_SERVER_USER}"
            deploy_path="/opt/gym-lockers-staging"
            ports="Frontend: :8080, API: :3101"
            ;;
        production)
            server_host="${SERVER_HOST}"
            server_user="${SERVER_USER}"
            deploy_path="/opt/lockers"
            ports="Frontend: :80/:443, API: :3001"
            ;;
    esac

    if [[ -z "$server_host" || -z "$server_user" ]]; then
        log_error "Server configuration missing for $env environment"
        log_error "Required: ${env^^}_SERVER_HOST and ${env^^}_SERVER_USER"
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would deploy to $env environment"
        log_info "Target: $server_user@$server_host:$deploy_path"
        return 0
    fi

    # Test SSH connection
    log_info "Testing SSH connection to $server_host..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$server_user@$server_host" exit 2>/dev/null; then
        log_error "Cannot connect to $server_host via SSH"
        log_error "Check your SSH keys and server configuration"
        exit 1
    fi

    # Create deployment script
    local deploy_script="deploy_${env}.sh"
    cat > "$deploy_script" << 'EOF'
#!/bin/bash
set -e

ENV_NAME="$1"
DEPLOY_PATH="$2"
BACKUP="$3"
FORCE_REBUILD="$4"

echo "🚀 Starting $ENV_NAME deployment..."

# Navigate to deployment directory
cd "$DEPLOY_PATH" || {
    echo "❌ Deployment directory not found: $DEPLOY_PATH"
    exit 1
}

# Backup current deployment
if [[ "$BACKUP" == "true" ]]; then
    echo "💾 Creating backup..."
    sudo docker-compose -f docker-compose.prod.yml down || true
    
    backup_dir="/opt/backups/gym-lockers-$(date +%Y%m%d_%H%M%S)"
    sudo mkdir -p "$(dirname "$backup_dir")"
    sudo cp -r . "$backup_dir" || echo "Backup failed, continuing..."
fi

# Pull latest code
echo "📋 Pulling latest changes..."
sudo git fetch origin
sudo git reset --hard origin/main

# Update environment
echo "⚙️ Updating environment configuration..."
if [[ ! -f .env ]]; then
    sudo cp env.${ENV_NAME} .env 2>/dev/null || sudo cp env.production .env
fi

# Docker operations
if [[ "$FORCE_REBUILD" == "true" ]]; then
    echo "🔨 Rebuilding images..."
    sudo docker-compose -f docker-compose.prod.yml build --no-cache
fi

# Start services
echo "🚀 Starting services..."
sudo docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 30

# Health checks
echo "🏥 Running health checks..."
sudo docker-compose -f docker-compose.prod.yml ps

# API health check
for i in {1..10}; do
    if curl -f http://localhost:3001/api/status > /dev/null 2>&1; then
        echo "✅ Backend API is responding"
        break
    elif [[ $i -eq 10 ]]; then
        echo "⚠️ Backend API not responding after 10 attempts"
    else
        echo "Attempt $i: Backend not ready, waiting..."
        sleep 5
    fi
done

echo "✅ $ENV_NAME deployment completed!"
EOF

    # Copy and execute deployment script
    log_info "Copying deployment script to server..."
    scp "$deploy_script" "$server_user@$server_host:/tmp/"

    log_info "Executing deployment on server..."
    ssh "$server_user@$server_host" "chmod +x /tmp/$deploy_script && sudo /tmp/$deploy_script '$env' '$deploy_path' '$BACKUP' '$FORCE_REBUILD'"

    # Cleanup
    rm -f "$deploy_script"

    log_success "$env deployment completed!"
    log_info "Services: $ports"
}

main() {
    parse_arguments "$@"
    
    log_info "Gym Lockers Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Force rebuild: $FORCE_REBUILD"
    log_info "Backup: $BACKUP"
    log_info "Dry run: $DRY_RUN"
    
    check_prerequisites

    case $ENVIRONMENT in
        local)
            deploy_local
            ;;
        staging|production)
            deploy_remote "$ENVIRONMENT"
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    log_success "Deployment script completed successfully!"
}

# Run main function
main "$@"
