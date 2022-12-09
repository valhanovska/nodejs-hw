const path = require("path");
const multer = require("multer");
const uploadDir = path.join(process.cwd(), "tmp");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const upload = multer({
  storage: storage,
});

module.exports = upload;
