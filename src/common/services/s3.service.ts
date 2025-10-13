import { HttpException, Injectable} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { env } from '../../utils/config';

@Injectable()
export class S3Service {
  private s3: S3Client;
  private bucketName: string;

  constructor() {
    this.s3 = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucketName = env.AWS_S3_BUCKET;
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      const fileKey = `uploads/${randomUUID()}-${file.originalname}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Return a public URL (if bucket is public)
      return `https://${this.bucketName}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new HttpException('Failed to upload file to S3',500);
    }
  }
}
