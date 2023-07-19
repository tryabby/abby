import { Project, User } from "@prisma/client";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
import { env } from "env/server.mjs";
import * as React from "react";
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
  const baseUrl =
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

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#000",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "normal",
  textAlign: "center" as const,
  margin: "30px 0",
  padding: "0",
};

const avatar = {
  borderRadius: "100%",
};

const link = {
  color: "#067df7",
  textDecoration: "none",
};

const text = {
  color: "#000",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  lineHeight: "24px",
};

const black = {
  color: "black",
};

const center = {
  verticalAlign: "middle",
};

const btn = {
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

const spacing = {
  marginBottom: "26px",
};
