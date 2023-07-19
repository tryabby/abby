import { Project, User } from "@prisma/client";
import { render } from "@react-email/render";
import { env } from "env/server.mjs";
import { createTransport } from "nodemailer";
import InviteEmail, { Props as InviteEmailProps } from "./invite";
import ContactFormularEmail, {
  Props as ContactMailProps,
} from "./ContactFormularEmail";

const transporter = createTransport({
  pool: true,
  url: env.EMAIL_SERVER,
  from: `A/BBY <${env.ABBY_FROM_EMAIL}>`,
});

export function sendInviteEmail(props: InviteEmailProps) {
  const email = render(<InviteEmail {...props} />);

  return transporter.sendMail({
    to: props.invitee.email,
    from: `A/BBY <${env.ABBY_FROM_EMAIL}>`,
    subject: `Join ${props.inviter.name} on A/BBY`,
    html: email,
  });
}

export function sendContactFormularEmail(props: ContactMailProps) {
  const email = render(<ContactFormularEmail {...props} />);
  const abbyContactAdress = "tim@tryabby.com";
  return transporter.sendMail({
    to: abbyContactAdress,
    from: `A/BBY <${env.ABBY_FROM_EMAIL}>`,
    subject: `New Message from ${props.name} ${props.surname}`,
    html: email,
  });
}
