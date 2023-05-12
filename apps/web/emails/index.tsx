import { Project, User } from "@prisma/client";
import { render } from "@react-email/render";
import { env } from "env/server.mjs";
import { createTransport } from "nodemailer";
import InviteEmail, { Props as InviteEmailProps } from "./invite";

const transporter = createTransport({
  pool: true,
  url: env.EMAIL_SERVER,
  from: "A/BBY <no-reply@tryabby.com>",
});

export function sendInviteEmail(props: InviteEmailProps) {
  const email = render(<InviteEmail {...props} />);

  return transporter.sendMail({
    to: props.invitee.email,
    from: "A/BBY <no-reply@tryabby.com>",
    subject: `Join ${props.inviter.name} on A/BBY`,
    html: email,
  });
}
