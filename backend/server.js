import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_KEY = process.env.ADMIN_KEY || "pioneer-admin-123";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const DATA_DIR = path.join(__dirname, "data");

const files = {
  enquiries: path.join(DATA_DIR, "enquiries.json"),
  notices: path.join(DATA_DIR, "notices.json"),
};

const defaultNotices = [
  {
    id: "notice-1",
    title: "Admissions Open For Session 2026-27",
    category: "Admission",
    createdAt: new Date().toISOString(),
  },
  {
    id: "notice-2",
    title: "Playway To Xth Class Registrations Started",
    category: "Registration",
    createdAt: new Date().toISOString(),
  },
  {
    id: "notice-3",
    title: "Annual Function Celebration This Month",
    category: "Event",
    createdAt: new Date().toISOString(),
  },
];

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "80kb" }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key"],
  })
);


async function ensureFile(file, fallback) {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(file, "utf8");
  } catch {
    await writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
  }
}

async function readJson(file, fallback = []) {
  await ensureFile(file, fallback);
  return JSON.parse((await readFile(file, "utf8")) || "[]");
}

async function writeJson(file, data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function clean(value) {
  return String(value || "").trim();
}

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(401).json({ message: "Wrong admin key" });
  }
  next();
}

function validateEnquiry(body) {
  const enquiry = {
    studentName: clean(body.studentName),
    parentName: clean(body.parentName),
    mobile: clean(body.mobile),
    className: clean(body.className),
    address: clean(body.address),
    previousSchool: clean(body.previousSchool),
    visitDate: clean(body.visitDate),
    message: clean(body.message),
  };

  if (enquiry.parentName.length < 2) return "Parent name is required";
  if (!/^[0-9+\-\s]{8,16}$/.test(enquiry.mobile)) return "Valid mobile number is required";
  if (!enquiry.className) return "Class for admission is required";
  return enquiry;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "School Website Backend" });
});

app.get("/api/public", async (req, res) => {
  const notices = await readJson(files.notices, defaultNotices);
  res.json({
    notices: notices.slice(0, 6),
    school: {
      name: "Pioneer Public School",
      phone: "9818182996",
      whatsapp: "919818182996",
      address: "B-110, Lal Bagh, Loni, Ghaziabad",
      email: "info@pioneerpublicschoolloni.com",
    },
  });
});

app.post("/api/enquiries", async (req, res) => {
  const result = validateEnquiry(req.body);
  if (typeof result === "string") return res.status(400).json({ message: result });

  const enquiries = await readJson(files.enquiries);
  const enquiry = {
    id: crypto.randomUUID(),
    ...result,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  enquiries.unshift(enquiry);
  await writeJson(files.enquiries, enquiries);
  res.status(201).json({ message: "Enquiry saved successfully", enquiry });
});

app.get("/api/admin/summary", requireAdmin, async (req, res) => {
  const enquiries = await readJson(files.enquiries);
  const notices = await readJson(files.notices, defaultNotices);
  const count = (status) => enquiries.filter((item) => item.status === status).length;

  res.json({
    totalEnquiries: enquiries.length,
    newEnquiries: count("new"),
    contacted: count("contacted"),
    admitted: count("admitted"),
    notices: notices.length,
  });
});

app.get("/api/admin/enquiries", requireAdmin, async (req, res) => {
  res.json({ enquiries: await readJson(files.enquiries) });
});

app.patch("/api/admin/enquiries/:id/status", requireAdmin, async (req, res) => {
  const allowed = ["new", "contacted", "visited", "admitted", "closed"];
  const status = clean(req.body.status);
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const enquiries = await readJson(files.enquiries);
  const enquiry = enquiries.find((item) => item.id === req.params.id);
  if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });

  enquiry.status = status;
  enquiry.updatedAt = new Date().toISOString();
  await writeJson(files.enquiries, enquiries);
  res.json({ message: "Status updated", enquiry });
});

app.get("/api/admin/notices", requireAdmin, async (req, res) => {
  res.json({ notices: await readJson(files.notices, defaultNotices) });
});

app.post("/api/admin/notices", requireAdmin, async (req, res) => {
  const title = clean(req.body.title);
  const category = clean(req.body.category) || "Notice";
  if (title.length < 4) return res.status(400).json({ message: "Notice title is required" });

  const notices = await readJson(files.notices, defaultNotices);
  const notice = { id: crypto.randomUUID(), title, category, createdAt: new Date().toISOString() };
  notices.unshift(notice);
  await writeJson(files.notices, notices);
  res.status(201).json({ message: "Notice added", notice });
});

app.delete("/api/admin/notices/:id", requireAdmin, async (req, res) => {
  const notices = await readJson(files.notices, defaultNotices);
  const next = notices.filter((item) => item.id !== req.params.id);
  await writeJson(files.notices, next);
  res.json({ message: "Notice deleted" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

await ensureFile(files.enquiries, []);
await ensureFile(files.notices, defaultNotices);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});