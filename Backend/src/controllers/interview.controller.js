const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * @description generates interview report based on user self description, resume pdf and job description
 */
async function generateInterviewReportController(req, res) {
  const { jobDescription, selfDescription } = req.body;
  const hasSelfDescription = selfDescription?.trim();

  if (!jobDescription?.trim()) {
    return res.status(400).json({ message: "Job description is required." });
  }
  if (!req.file && !hasSelfDescription) {
    return res.status(400).json({
      message: "Upload a PDF resume or provide a self-description.",
    });
  }

  const resumeContent = req.file ? await pdfParse(req.file.buffer) : null;

  const interviewReportByAi = await generateInterviewReport({
    resume: resumeContent?.text || "",
    selfDescription,
    jobDescription,
  });

  const interviewReport = await interviewReportModel.create({
    user: req.user.id,
    resume: resumeContent?.text || "",
    jobDescription,
    selfDescription,
    ...interviewReportByAi,
  });

  res.status(201).json({
    message: "Interview report generated successfully...",
    interviewReport,
  });
}

/**
 * @description get interview report by interviewId
 */
async function getInterviewReportByIdController(req, res) {
  const { interviewId } = req.params;
  const interviewReport = await interviewReportModel.findOne({
    _id: interviewId,
    user: req.user.id,
  });

  if (!interviewReport) {
    return res.status(400).json({
      message: "Interview report not found",
    });
  }
  res.status(200).json({
    message: "Report found",
    interviewReport,
  });
}

/**
 * @description get all interview reports of a user
 */
async function getAllInterviewReportsController(req, res) {
  const interviewReports = await interviewReportModel
    .find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .select(
      "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
    );
  res.status(200).json({
    message: "All interview reports fetched successfully",
    interviewReports,
  });
}

/**
 * @description
 */
async function generateResumePdfController(req, res) {
  const { interviewReportId } = req.params;
  const interviewReport =
    await interviewReportModel.findById(interviewReportId);
  if (!interviewReport) {
    return res.status(404).json({
      message: "Interview report not found",
    });
  }

  const { resume, jobDescription, selfDescription } = interviewReport;
  const pdfBuffer = await generateResumePdf({
    resume,
    jobDescription,
    selfDescription,
  });

  res.set({
    "Content-type": "application/pdf",
    "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
  });

  res.send(pdfBuffer);
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};
