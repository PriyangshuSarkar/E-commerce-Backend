import multer, { diskStorage } from "multer";
import { v4 } from "uuid";

const storage = diskStorage({
  destination(req, file, callback) {
    callback(null, "./public/images");
  },
  filename(req, file, callback) {
    const id = v4();
    const extName = file.originalname.split(".").pop();
    const filename = `${id}.${extName}`;
    callback(null, filename);
  },
});

export const singleUpload = multer({ storage });
