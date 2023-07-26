type SeoProps = {
  metaDescription: string;
  metaTitle: string;
};

type Layouts = "Marketing" | "Blog" | "Integrations" | "DashBoard" | "Docs";

export function getSeo(pageName: string, layoutName: Layouts) {
  switch (layoutName) {
    case "Blog":
      return getBlogLayout(pageName);
    case "Marketing":
    default:
      return getMarketingSeo(pageName);
  }
}

export function getMarketingSeo(pageName: string): SeoProps {
  const normalizedKey = pageName.startsWith("/") ? pageName : "/" + pageName;
  switch (normalizedKey) {
    case "/":
      return {
        metaTitle:
          "Open Source A/B Tests, Feature Flags and feature testing | A/BBY",
        metaDescription:
          "Looking for a free and easy-to-implement A/B testing tool for developers? Check out our open-source software that includes feature flags and allows for fast and efficient feature testing. Start optimizing your website or application today!",
      };
    case "/login":
      return {
        metaTitle:
          "A/B Tests, Feature Flags and feature testing | A/BBY Log in",
        metaDescription:
          "Log in to our free A/B testing tool designed specifically for developers. With open source software, it offers easy and fast implementation, allowing you to perform feature testings and utilize feature flags. Start optimizing your website or application with our free AB testing tool today.",
      };
    case "/devtools":
      return {
        metaTitle:
          "Learn about A/B testing tools and feature flags | A/BBY Documentation",
        metaDescription:
          "Learn about the implementation of A/B testing tools, open-source software that is easy and fast to implement. Discover how feature flags can help you with feature testing and explore various developer tools available for A/B testing purposes.",
      };
    case "/imprint":
      return {
        metaTitle:
          "A/B Tests, Feature Flags and feature testings | A/BBY Legal Information",
        metaDescription:
          "Official imprint of A/BBY, the open-source A/B testing tool. Find our legal information and get in touch. We offer feature flagging and ab testing solutions with clear analytics.",
      };
    case "/blog":
      return {
        metaTitle:
          "A/B Tests, Feature Flags & feature testing | A/BBY Tips&Insights",
        metaDescription:
          "Discover tips and insights about A/B testing tools, open-source software, feature flags, Next.js, and A/B testing in React. Learn how to effectively use these dev tools for feature testing and optimizing your software development process.",
      };
    case "/blog/a-b-react":
      return {
        metaTitle: "A/B Testing in React using Hooks | A/BBY Tips & Insights",
        metaDescription:
          "Learn about implementing A/B testing in React using hooks with A/BBY. Understand the benefits of A/B testing and how to use the use A/BBY hook for improved user experience and data-driven decision-making.",
      };
    case "/contact":
      return {
        metaTitle: "Q&A regarding A/BBY | A/BBY Contact",
        metaDescription:
          "Contact A/BBY, an open-source A/B testing tool, for all your questions and needs related to A/B testing, feature flags, and feature testing. Optimize your software with confidence.",
      };
    case "/docs/integrations/react":
      return {
        metaTitle: "A/B tests & Feature Flags with React | A/BBY Documentation",
        metaDescription:
          "Integrating A/B tests with React and leveraging feature flags for feature testing can greatly enhance your development process. Learn how to effectively implement A/B tests with A/BBY and improve your React applications with this comprehensive guide.",
      };
    case "/docs/integrations/svelte":
      return {
        metaTitle:
          "Integrating A/B tests & Feature Flags with Svelte | A/BBY Documentation",
        metaDescription:
          "Integrating an A/B testing tool with Svelte can help you optimize your web application's user experience. Learn how to seamlessly incorporate A/BBY an A/B testing software into your Svelte projects for better insights and data-driven decision making.",
      };
    case "/docs/integrations/nextjs":
      return {
        metaTitle: "Integrating A/B tests with Next.js | A/BBY Documentation",
        metaDescription:
          "Integrating A/B tests like A/BBY with Next.js allows developers to effectively conduct feature testing and utilize feature flags. Discover the benefits and best practices for implementing Split tests and feature flags in Next.js.",
      };
    case "/blog/a-b-nextjs":
      return {
        metaTitle:
          "A/B Testing in Next.js using Edge Middleware | A/BBY Tips & Insights",
        metaDescription:
          "A/B testing in Next.js using edge middleware allows you to experiment and optimize your website by testing different versions of your content. Learn the tips and insights on how to effectively conduct A/B tests in Next.js using edge middleware with A/BBY.",
      };
    case "/blog/abby-open-source":
      return {
        metaTitle:
          "Open-Source A/B Test Transparency & Self-Hosted | A/BBY Tips&Insights",
        metaDescription:
          "Open-sourcing A/B tests and using feature flags for feature testing can improve transparency, collaboration, and self-hosting capabilities. Discover valuable tips and insights on implementing A/B tests and feature testing strategies with A/BBY.",
      };
    case "/blog/feature-flags-next":
      return {
        metaTitle:
          "Using Feature Flags in Next.js Applications | A/BBY Tips & Insights",
        metaDescription:
          "Learn how to effectively use feature flags in Next.js applications to conduct A/B tests and perform feature testing. Get valuable tips and insights in this A/BBY article to optimize your software development process.",
      };
    case "/terms":
      return {
        metaTitle: "A/B Testing and Feature Flags - | A/BBY Terms of Service",
        metaDescription:
          "Discover the benefits of A/B testing and feature flags in improving product development and user experience. Learn about A/BBY's Terms of Service and how they ensure fair and transparent testing practices for your business.",
      };
    case "/privacy":
      return {
        metaTitle: "Privacy Policy and Data Protection | A/BBY",
        metaDescription:
          "Learn about A/BBY's privacy policy and data protection measures for conducting A/B tests, using feature flags, and feature testing.",
      };
    case "/nextjs":
      return {
        metaTitle:
          "A/B test for Next.js - Streamline A/B Tests & Feature Flags | A/BBY",
        metaDescription:
          "A/BBY is a powerful A/B testing tool for Next.js applications that streamlines the process of conducting split tests and feature flagging. Learn how to optimize your Next.js projects with A/BBY's efficient and user-friendly platform.",
      };
    case "/docs/integrations/angular":
      return {
        metaTitle:
          "Integrating A/B testing and feature testing into Angular applications | A/BBY Documentation",
        metaDescription:
          "Integrating A/B testing and feature testing into Angular applications can provide valuable insights and enhance the development process. This page provides information and resources for developers looking to implement these techniques in their Angular projects.",
      };
    case "/docs/environments":
      return {
        metaTitle:
          "Understanding and managing different environments in application development | A/BBY Documentation",
        metaDescription:
          "Understanding and managing different environments in application development is crucial for developers. Learn about environments, split testing, and how to effectively utilize them in this informative guide.",
      };
    case "/docs/a-b-testing":
      return {
        metaTitle: "AB tests in software development | A/BBY Documentation",
        metaDescription:
          "AB tests in software development provide valuable insights for developers. This documentation provides detailed information on implementing.",
      };
    case "/docs/feature-flags":
      return {
        metaTitle:
          "Feature flag documentation for developers | A/BBY Documentation",
        metaDescription:
          "Feature flag documentation for developers provides a comprehensive guide on how to effectively implement and test feature flags in different development environments. Learn how to optimize your development process and improve feature release management.",
      };
    case "/docs/reference/nextjs":
      return {
        metaTitle: "API Reference in Next.js for AB test | A/BBY Documentation",
        metaDescription:
          "Learn how to implement API references in Next.js for conducting A/B tests with our comprehensive documentation for developers. Get step-by-step instructions and code snippets for ensuring accurate and efficient implementation.",
      };
    case "/docs/reference/http":
      return {
        metaTitle:
          "API Reference (HTTP API) for conducting A/B tests | A/BBY Documentation",
        metaDescription:
          "Our API Reference (HTTP API) page provides developers with the essential code and documentation needed to utilize our API for conducting A/B tests. Explore our comprehensive guide to seamlessly integrate our API and enhance your development process.",
      };
    case "/docs/reference/angular":
      return {
        metaTitle:
          "Using AbbyModule in Angular projects for seamless testing and optimization | A/BBY Documentation",
        metaDescription:
          "AbbyModule is an Angular module that provides useful directives for developers, including an AB test integration. This documentation will guide you on how to use and integrate AbbyModule into your Angular projects for seamless testing and optimization.",
      };
    case "/docs/reference/svelte":
      return {
        metaTitle: "API Reference for Svelte developers | A/BBY Documentation",
        metaDescription:
          "The API Reference for Svelte is a comprehensive guide that provides documentation and examples for developers using the Svelte framework. Learn how to leverage the features and functionalities of Svelte through this detailed API reference guide.",
      };
    case "/docs/reference/react":
      return {
        metaTitle: "API reference for React developers | A/BBY Documentation",
        metaDescription:
          "The API reference for React provides detailed documentation for developers looking to implement AB testing in their React applications. Explore this comprehensive guide to understand how to integrate and utilize the API effectively.",
      };

    default:
      return {
        metaTitle: "Open Source A/B Tests, Feature Flags and feature testing",
        metaDescription:
          "Looking for a free and easy-to-implement A/B testing tool for developers? Check out our open-source software that includes feature flags and allows for fast and efficient feature testing. Start optimizing your website or application today!",
      };
  }
}
function getBlogLayout(pageName: string): SeoProps {
  switch (pageName) {
    case "/":
      return {
        metaDescription: "",
        metaTitle: "",
      };
    default:
      return {
        metaDescription: "",
        metaTitle: "",
      };
  }
}
