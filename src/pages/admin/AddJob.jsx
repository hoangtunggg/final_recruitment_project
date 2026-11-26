import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiFileText,
  FiCheck,
} from "react-icons/fi";
import { useJobs } from "../../context/JobContext";

const AddJob = () => {
  const navigate = useNavigate();
  const { addJob } = useJobs();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    responsibilities: "",
    salary: "",
    experience: "Entry Level",
    education: "",
    skills: "",
    benefits: "",
    applicationDeadline: "",
    contactEmail: "",
    contactPhone: "",
    status: "Published",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.company.trim()) newErrors.company = "Company is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.requirements.trim())
      newErrors.requirements = "Requirements are required";
    if (!formData.responsibilities.trim())
      newErrors.responsibilities = "Responsibilities are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const result = await addJob({
        ...formData,
        approvalStatus: "approved",
      });
      if (result.success) {
        alert("Job created successfully!");
        navigate("/admin/jobs");
      } else {
        alert(`Error posting job: ${result.error}`);
      }
    }
  };

  const handleSaveDraft = async () => {
    const result = await addJob({ ...formData, status: "Draft" });
    if (result.success) {
      alert("Draft saved successfully!");
    } else {
      alert(`Error saving draft: ${result.error}`);
    }
  };

  const handlePublish = async () => {
    if (validateForm()) {
      const result = await addJob({
        ...formData,
        status: "Published",
        approvalStatus: "approved",
      });
      if (result.success) {
        alert("Job published successfully!");
        navigate("/admin/jobs");
      } else {
        alert(`Error publishing job: ${result.error}`);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate("/admin/jobs")}
            className="flex items-center text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:text-white mr-4"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to Jobs
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Job</h1>
            <p className="text-slate-600 dark:text-gray-300 mt-1">
              Create a new job posting for your company
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <FiBriefcase className="mr-2" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                aria-label="Job title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="e.g. Senior React Developer"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Company *
              </label>
              <input
                type="text"
                name="company"
                aria-label="Company"
                value={formData.company}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.company ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="e.g. Tech Corp"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                <FiMapPin className="inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                name="location"
                aria-label="Location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.location ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="e.g. San Francisco, CA or Remote"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Job Type
              </label>
              <select
                name="type"
                aria-label="Job type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                <FiDollarSign className="inline mr-1" />
                Salary Range
              </label>
              <input
                type="text"
                name="salary"
                aria-label="Salary range"
                value={formData.salary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. $80k - $120k"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                <FiClock className="inline mr-1" />
                Experience Level
              </label>
              <select
                name="experience"
                aria-label="Experience level"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <FiFileText className="mr-2" />
            Job Details
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                aria-label="Job description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="Provide a detailed description of the role..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Responsibilities *
              </label>
              <textarea
                name="responsibilities"
                aria-label="Responsibilities"
                value={formData.responsibilities}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.responsibilities ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="List the key responsibilities for this role..."
              />
              {errors.responsibilities && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.responsibilities}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Requirements *
              </label>
              <textarea
                name="requirements"
                aria-label="Requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.requirements ? "border-red-500" : "border-slate-300 dark:border-gray-600"
                }`}
                placeholder="List the required skills, qualifications, and experience..."
              />
              {errors.requirements && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.requirements}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                  Education
                </label>
                <input
                  type="text"
                  name="education"
                aria-label="Education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Bachelor's in Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                  Skills
                </label>
                <input
                  type="text"
                  name="skills"
                aria-label="Skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. React, JavaScript, Node.js"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Benefits
              </label>
              <textarea
                name="benefits"
                aria-label="Benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List the benefits and perks offered..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Application Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                aria-label="Application deadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                aria-label="Contact email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hr@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                aria-label="Contact phone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
          >
            <FiCheck className="mr-2" />
            Publish Job
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Job
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddJob;
