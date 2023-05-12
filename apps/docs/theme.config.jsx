import { useRouter } from "next/router";

export default {
  useNextSeoProps() {
    const router = useRouter();

    const currentPageUrl = `https://docs.tryabby.com${router.asPath}`;
    return {
      titleTemplate: "%s – A/BBY Docs",
      description:
        "A/BBY is a SaaS tool for developers to streamline A/B testing and feature flagging. Make data-driven decisions and improve user experience with ease.",
      openGraph: {
        url: currentPageUrl,
        title: "A/BBY Docs",
        type: "website",
        description:
          "A/BBY is a SaaS tool for developers to streamline A/B testing and feature flagging. Make data-driven decisions and improve user experience with ease.",
        images: [
          {
            url: "https://tryabby.com/og.png",
            width: 1200,
            height: 630,
            alt: "A/BBY",
            type: "image/png",
          },
        ],
        siteName: "A/BBY Docs",
      },
    };
  },
  head: (
    <>
      <link rel="icon" href="https://tryabby.com/favicon.png" />
    </>
  ),
  logo: <span style={{ fontSize: "1.75rem", fontWeight: "bold" }}>A/BBY</span>,
  // docsRepositoryBase: 'https://github.com/cstrnt/abby/blob/main/apps/docs/pages',
  project: {
    // link: "https://github.com/cstrnt/abby",
  },
  feedback: {
    content: null,
  },
  editLink: {
    component: null,
  },
  sidebar: {
    toggleButton: true,
  },
  defaultShowCopyCode: true,
  footer: {
    component: null,
  },
  // ...
};
