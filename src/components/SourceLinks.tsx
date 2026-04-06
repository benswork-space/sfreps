import type { SupervisorLinks } from "@/lib/types";

interface Props {
  links: SupervisorLinks;
  district: number;
}

export default function SourceLinks({ links, district }: Props) {
  const items = [
    { label: `District ${district} Official Page`, href: links.official_page },
    { label: "Campaign Finance (Ethics Commission)", href: links.ethics_commission },
    { label: "Voting Record (Legistar)", href: links.legistar },
    { label: "Campaign Finance Dashboard", href: links.campaign_finance },
    { label: "Methodology & Data Sources", href: `${process.env.__NEXT_ROUTER_BASEPATH || ""}/methodology` },
  ];

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3">Sources & Links</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target={item.href.startsWith("/") ? undefined : "_blank"}
              rel={item.href.startsWith("/") ? undefined : "noopener noreferrer"}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
            >
              {item.label}
              {!item.href.startsWith("/") && (
                <span className="ml-1 text-zinc-400">{"\u2197"}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
