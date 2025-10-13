import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { env } from 'src/utils/config';
import { generateOtpTemplate } from 'src/utils/template';

@Injectable()
export class EmailService {
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    from = 'lantrancute2006@gmail.com',
    otp: string
  ) {
    console.log(from);
    const command = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: generateOtpTemplate('otp verification',otp) },
        },
      },
      Source: from,
    });

    await this.sesClient.send(command);
  }
}
