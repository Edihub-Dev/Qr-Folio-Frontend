import React from "react";
import { ArrowUpDown } from "lucide-react";

const AdminTable = ({
  columns = [],
  data = [],
  sortBy,
  sortDir,
  onSort,
  renderActions,
}) => {
  const handleSort = (key) => {
    if (!onSort) return;
    if (sortBy === key) {
      onSort(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "asc");
    }
  };

  return (
    <div className="overflow-scroll rounded-xl  border border-gray-600 bg-white">
      <table className="min-w-full divide-y  divide-gray-600">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                <button
                  type="button"
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={`flex items-center gap-2 ${
                    column.sortable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span>{column.label}</span>
                  {column.sortable && (
                    <ArrowUpDown
                      className={`h-3 w-3 text-gray-400 transition-transform ${
                        sortBy === column.key && sortDir === "asc"
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  )}
                </button>
              </th>
            ))}
            {renderActions && (
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (renderActions ? 1 : 0)}
                className="px-4 py-12 text-center text-sm text-gray-500"
              >
                No records found.
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.id || row._id} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 text-sm text-gray-700"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
              {renderActions && (
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
