import { Link } from "react-router-dom";
import { FaHome, FaArrowLeft } from "react-icons/fa";

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 flex flex-col justify-center items-center px-4 py-12 transition-colors">
      <div className="w-full max-w-lg mx-auto text-center bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-xl p-6 sm:p-10">
        <h1 className="text-5xl font-bold text-blue-700 dark:text-blue-300 mb-3 tracking-tight">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-slate-600 dark:text-gray-300 mb-6 leading-relaxed">
          The page you are looking for doesn't exist, has been removed, or has been relocated.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center px-5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <FaHome className="mr-2 text-xs" />
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex min-h-11 items-center justify-center px-5 border border-slate-300 dark:border-gray-600 text-sm font-semibold rounded-lg text-slate-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
          >
            <FaArrowLeft className="mr-2 text-xs" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
