import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

/**
 * @description generate interview report on the basis of user self description, resume pdf and job description
 */

export const generateInterviewReport = async ({
  selfDescription,
  jobDescription,
  resumeFile,
}) => {
  const formData = new FormData();
  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);
  if (resumeFile) {
    formData.append("resume", resumeFile);
  }

  const response = await api.post("/api/interview", formData);
  return response.data;
};

/**
 * @description get interview report by interviewId
 */
export const getInterviewReportById = async (interviewId) => {
  const response = await api.get(`/api/interview/report/${interviewId}`);
  return response.data;
};

/**
 * @description get all interview reports of a user
 */

export const getAllInterviewReports = async () => {
  const response = await api.get("/api/interview");
  return response.data;
};
