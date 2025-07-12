import React, { useState, useEffect } from 'react';
import { PulseLoader } from "react-spinners";
import axiosInstance from "../../axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axiosInstance.get("/blogs");
        setBlogs(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        toast.error("Failed to load blogs. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={60} color="#12EB8E" />
      </div>
    );
  }

  return (
    <section className="py-12 px-2 md:px-12 text-white bg-[#101218]">
      <ToastContainer />
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold md:text-4xl text-center mb-4">
          Stay Connected on our  
          <span className="my-gradient-text"> Newsletter</span>
        </h2>
        <p className="text-center text-gray-400 max-w-2xl mx-auto mb-8">
          You’ll get lot to know that how profit first can help you to scale your D2C brand and how other’s KPI’s work.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {blogs.map((blog) => (
            <div
              key={blog._id || blog.id}
              className="bg-[#161616] rounded-lg shadow hover:shadow-lg transition flex flex-col p-6 mx-auto w-full md:w-[85%]"
            > 
              <div className="relative">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  {blog.category}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                <div className="flex justify-between text-sm text-gray-400 mt-auto">
                  <span>By {blog.author}</span>
                  <span>{blog.date}</span>
                </div>
                <button
                  onClick={() => setSelectedBlog(blog)}
                  className="mt-3 text-sm text-green-500 hover:underline self-start"
                >
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBlog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] w-full max-w-2xl mx-4 p-6 rounded-lg shadow relative text-white h-[80vh] flex flex-col">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl font-bold"
              onClick={() => setSelectedBlog(null)}
            >
              &times;
            </button>
            <div className="overflow-y-auto pr-2 mt-4 space-y-4">
              <img
                src={selectedBlog.image}
                alt={selectedBlog.title}
                className="w-full h-60 object-cover rounded-t-lg"
              />
              <h3 className="text-sm text-green-500 font-semibold">
                {selectedBlog.category}
              </h3>
              <p className="text-sm text-gray-400">
                By {selectedBlog.author} | {selectedBlog.date}
              </p>

              <h2 className="text-2xl font-bold">{selectedBlog.title}</h2>
              <div
                className="leading-relaxed text-gray-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Blogs;
