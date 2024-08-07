import { useRouter } from "next/router";

export default {
  useNextSeoProps() {
    const router = useRouter();
    const currentPageUrl = `https://docs.tryabby.com${router.asPath}`;
    return {
      titleTemplate: "%s – Abby Docs",
      description:
        "Abby is a SaaS tool for developers to streamline A/B testing and feature flagging. Make data-driven decisions and improve user experience with ease.",
      openGraph: {
        url: currentPageUrl,
        title: "Abby Docs",
        type: "website",
        description:
          "Abby is a SaaS tool for developers to streamline A/B testing and feature flagging. Make data-driven decisions and improve user experience with ease.",
        images: [
          {
            url: "https://www.tryabby.com/og.png",
            width: 1200,
            height: 630,
            alt: "Abby",
            type: "image/png",
          },
        ],
        siteName: "Abby Docs",
      },
    };
  },
  search: {
    loading: "Loading...",
    placeholder: "Search...",
  },
  head: (
    <>
      <link rel="icon" href="https://www.tryabby.com/favicon.png" />
    </>
  ),
  logo: <span style={{ fontSize: "1.75rem", fontWeight: "bold" }}>Abby</span>,
  // docsRepositoryBase: 'https://github.com/cstrnt/abby/blob/main/apps/docs/pages',
  project: {
    // link: "https://github.com/cstrnt/abby",
  },
  feedback: {
    content: null,
  },
  editLink: {
    component: () => <></>,
  },
  sidebar: {
    toggleButton: true,
  },
  footer: {
    component: null,
  },
  // ...
};
