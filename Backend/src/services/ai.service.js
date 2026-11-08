const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { toJSONSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe("The match score between the job description and the resume"),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked in the interview"),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with the intention of interviewer and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question that can be asked in the interview",
          ),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with the intention of interviewer and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill that the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("The severity of the skill gap"),
      }),
    )
    .describe(
      "Skill gaps that the candidate has along with the severity of the gap",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe("The day of the preparation plan"),
        focus: z
          .string()
          .describe("The focus of the preparation plan for that day"),
        tasks: z.array(z.string()).describe("The tasks to be done on that day"),
      }),
    )
    .describe("A plan for preparing for the interview"),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  jobDescription,
  selfDescription,
}) {
  const prompt = `Generate an interview report for a candidate with the following details:
  - Resume: ${resume}
    - Job Description: ${jobDescription}
    - Self Description: ${selfDescription}
    `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(interviewReportSchema),
    },
  });

  return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
}

async function generateResumePdf({ resume, jobDescription, selfDescription }) {
  const resumePdfSchema = z.object({
    html: z.string().describe("The HTML content of the resume PDF"),
  });

  const prompt = `Generate a resume of the resume with the following details:
  - Resume: ${resume}
  - Job Description: ${jobDescription}
  - Self Description: ${selfDescription}

  the response should be a JSON object with a single field "html" containing the HTML content of the resume PDF. The HTML should be well-structured and formatted for a professional resume.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);
  return pdfBuffer;
}
module.exports = { generateInterviewReport, generateResumePdf };
