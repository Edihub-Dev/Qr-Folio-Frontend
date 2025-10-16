import React from "react";
import { Users, ShieldCheck, AlertCircle, IndianRupee } from "lucide-react";

const iconMap = {
  users: Users,
  paid: ShieldCheck,
  blocked: AlertCircle,
  revenue: IndianRupee,
};

const cardSpecs = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: "users",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "paidUsers",
    label: "Paid Users",
    icon: "paid",
    format: (value, stats) => `${value.toLocaleString()} (${stats.totalUsers ? Math.round((value / stats.totalUsers) * 100) : 0}%)`,
  },
  {
    key: "blockedUsers",
    label: "Blocked Users",
    icon: "blocked",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: "revenue",
    format: (value) => `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
];

const AdminStatsCards = ({ stats = {} }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cardSpecs.map((card) => {
        const Icon = iconMap[card.icon];
        const value = stats[card.key] ?? 0;
        return (
          <div key={card.key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {card.format(value, stats)}
                </p>
              </div>
              <div className="rounded-2xl bg-primary-50 p-3 text-primary-600">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatsCards;
