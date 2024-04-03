import { Project } from "@prisma/client";
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
import * as React from "react";
import { ABBY_BASE_URL } from "@tryabby/core";

export type Props = {
  inviteId: string;
  invitee: { name?: string; email: string };
  inviter: { name: string; email: string };
  project: Project;
};

export default function Email({ inviteId, invitee, inviter, project }: Props) {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : ABBY_BASE_URL;

  return (
    <Html>
      <Head />
      {/* @ts-ignore types are off */}
      <Preview>Join {inviter.name} on Abby</Preview>
      <Section style={main}>
        <Container style={container}>
          <Section style={{ marginTop: "32px" }}>
            <h1>Abby</h1>
          </Section>
          <Text style={h1}>
            Join <strong>{project.name}</strong> on <strong>Abby</strong>
          </Text>
          <Text style={text}>Hello {invitee.name ?? invitee.email},</Text>
          <Text style={text}>
            <strong>{inviter.name}</strong> (
            <Link href={`mailto:${inviter.email}`} style={link}>
              {inviter.email}
            </Link>
            ) has invited you to the <strong>{project.name}</strong> team on{" "}
            <strong>Abby</strong>.
          </Text>
          <Section style={{ textAlign: "center" }}>
            <Button
              pX={20}
              pY={12}
              style={btn}
              href={`${baseUrl}invites/${inviteId}`}
            >
              Join the team
            </Button>
          </Section>
          <Text style={text}>
            <br />
            or copy and paste this URL into your browser:{" "}
            <Link
              href={`${baseUrl}invites/${inviteId}`}
              target="_blank"
              style={link}
              rel="noreferrer"
            >
              {baseUrl}invites/{inviteId}
            </Link>
          </Text>
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
