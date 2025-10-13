import { HttpException, HttpStatus } from '@nestjs/common';
import { memoryStorage, Options } from 'multer';

export const configMulter: Options = {
  storage: memoryStorage(), // ✅ no destination or filename needed
  fileFilter: (_, file, callback) => {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      return callback(
        new HttpException('Only image files are allowed!', HttpStatus.BAD_REQUEST) as any,
        false,
      );
    }
    callback(null, true);
  },
};
