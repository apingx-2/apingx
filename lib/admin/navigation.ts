export type AdminNavItem = {
  label: string;
  href: string;
  description: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    description: "Archive summary and publishing status",
  },
  {
    label: "Collections",
    href: "/admin/collections",
    description: "Published and draft collections",
  },
  {
    label: "Products",
    href: "/admin/products",
    description: "Physical products within collections",
  },
  {
    label: "Contributors",
    href: "/admin/contributors",
    description: "Recognised creators and participants",
  },
  {
    label: "Credentials",
    href: "/admin/credentials",
    description: "Digital certificates of participation",
  },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
