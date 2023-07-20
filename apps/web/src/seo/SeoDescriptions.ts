import { TbLayoutAlignMiddle } from "react-icons/tb";

type SeoProps = {
  metaDescription: string;
  metaTitle: string;
};

type Layouts = "Marketing" | "Blog" | "Integrations" | "DashBoard" | "Docs";

export function getSeo(pageName: string, layoutName: Layouts) {
  switch (layoutName) {
    case "Marketing":
      return getMarketingSeo(pageName);
    case "Blog":
      return getBlogLayout(pageName);
    default:
      return getMarketingSeo(pageName);
  }
}

export function getMarketingSeo(pageName: string): SeoProps {
  console.log("pageName", pageName);
  switch (pageName) {
    case "/":
    case "/#features":
    case "/#pricing":
      return {
        metaTitle: "Open Source A/B Tests, Feature Flags and feature testing  ",
        metaDescription:
          "Looking for a free and easy-to-implement A/B testing tool for developers? Check out our open-source software that includes feature flags and allows for fast and efficient feature testing. Start optimizing your website or application today!",
      };
    case "/login":
      return {
        metaTitle: "A/B Tests, Feature Flags and feature testing Log in",
        metaDescription:
          "Log in to our free A/B testing tool designed specifically for developers. With open-source software, it offers easy and fast implementation, allowing you to perform feature testings and utilize feature flags. Start optimizing your website or application with our free AB testing tool today.",
      };
    case "/devtools":
      return {
        metaTitle:
          "Learn about the implementation of A/B testing tools, open-source software that is easy and fast to implement. Discover how feature flags can help you with feature testing and explore various developer tools available for A/B testing purposes.",
        metaDescription: "",
      };
    case "/imprint":
      return {
        metaTitle:
          "Imprint: A/B Tests, Feature Flags and feature testings Legal Information",
        metaDescription:
          "Official imprint of A/BBY, the open-source A/B testing tool. Find our legal information and get in touch. We offer feature flagging and ab testing solutions with clear analytics.",
      };
    case "/blog":
      return {
        metaTitle: "",
        metaDescription:
          "Discover tips and insights about A/B testing tools, open-source software, feature flags, Next.js, and A/B testing in React. Learn how to effectively use these dev tools for feature testing and optimizing your software development process.",
      };
    case "/blog/a-b-react":
      return {
        metaTitle: '"A/B Testing in React using Hooks Tips & Insights"',
        metaDescription:
          "Learn about implementing A/B testing in React using hooks with A/BBY. Understand the benefits of A/B testing and how to use the use A/BBY hook for improved user experience and data-driven decision-making.",
      };
    case "/contact":
      return {
        metaTitle: "Answers to questions regarding A/B tests Contact",
        metaDescription:
          "Contact A/BBY, an open-source A/B testing tool, for all your questions and needs related to A/B testing, feature flags, and feature testing. Optimize your software with confidence.",
      };
    default:
      throw new Error("no title");
      return {
        metaTitle: "default Title",
        metaDescription:
          "Contact A/BBY, an open-source A/B testing tool, for all your questions and needs related to A/B testing, feature flags, and feature testing. Optimize your software with confidence.",
      };
  }
}
function getBlogLayout(pageName: string): SeoProps {
  switch (pageName) {
    case "":
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
