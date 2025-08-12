import React from 'react';
import classNames from 'classnames';

const Table = ({ children, className, ...props }) => (
  <div className="overflow-x-auto">
    <table
      className={classNames(
        'min-w-full divide-y divide-app-border',
        className
      )}
      {...props}
    >
      {children}
    </table>
  </div>
);

const Thead = ({ children, className, ...props }) => (
  <thead className={classNames('bg-app-bg-tertiary', className)} {...props}>
    {children}
  </thead>
);

const Th = ({ children, className, ...props }) => (
  <th
    className={classNames(
      'px-6 py-3',
      'text-left text-sm font-medium text-app-text-primary',
      className
    )}
    {...props}
  >
    {children}
  </th>
);

const Tbody = ({ children, className, ...props }) => (
  <tbody
    className={classNames(
      'bg-app-bg-secondary divide-y divide-app-border',
      className
    )}
    {...props}
  >
    {children}
  </tbody>
);

const Td = ({ children, className, ...props }) => (
  <td
    className={classNames(
      'px-6 py-4',
      'text-sm text-app-text-primary',
      className
    )}
    {...props}
  >
    {children}
  </td>
);

Table.Head = Thead;
Table.Body = Tbody;
Table.Th = Th;
Table.Td = Td;

export default Table;