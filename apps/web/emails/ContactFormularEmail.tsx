import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Html } from "@react-email/html";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { ABBY_BASE_URL } from "@tryabby/core";

export type Props = {
  surname: string;
  name: string;
  mailadress: string;
  message: string;
};

export default function ContactFormularEmail({
  surname,
  mailadress,
  name,
  message,
}: Props) {
  const _baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : ABBY_BASE_URL;

  return (
    <Html>
      <Head />
      {/* @ts-ignore types are off */}
      <Preview>
        {name} {surname} tried to contact{" "}
      </Preview>
      <Section style={main}>
        <Container style={container}>
          Name: {name} {surname}
          <br />
          Email: {mailadress}
          <br />
          Message:
          <br />
          <pre>{message}</pre>
        </Container>
      </Section>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
};

const container = {
  border: "1px solid #eaeaea",
  borderRadius: "5px",
  margin: "40px auto",
  padding: "20px",
  width: "465px",
};

const _logo = {
  margin: "0 auto",
};

const _h1 = {
  color: "#000",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "normal",
  textAlign: "center" as const,
  margin: "30px 0",
  padding: "0",
};

const _avatar = {
  borderRadius: "100%",
};

const _link = {
  color: "#067df7",
  textDecoration: "none",
};

const _text = {
  color: "#000",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  lineHeight: "24px",
};

const _black = {
  color: "black",
};

const _center = {
  verticalAlign: "middle",
};

const _btn = {
  backgroundColor: "#000",
  borderRadius: "5px",
  color: "#fff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "50px",
  textDecoration: "none",
  textAlign: "center" as const,
};

const _spacing = {
  marginBottom: "26px",
};
