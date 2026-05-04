import React from "react";
import Image from "next/image";

// Recreating the layout and styling from the user-provided image.
export default function ProfilePage() {
  return (
    // Outer container: light gray background (#e2e8f0), centering the content, full height.
    <div className="bg-[#e2e8f0] p-6 md:p-10 w-full min-h-screen flex flex-col font-sans">
      {/* Page Title: "Profile", large bold text matching the image */}
      <h1 className="text-[28px] font-bold text-black mb-8 px-2 md:px-0">
        Profile
      </h1>

      {/* Main Profile Card: white background, large border radius, small shadow, and some padding.
          This card contains all the profile information and is centered within the outer div. */}
      <div className="bg-white rounded-[16px] shadow-sm p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start w-full max-w-[900px] mx-auto border border-gray-100">
        {/* Profile Image Column: set width and aspect ratio for the image container */}
        <div className="w-[180px] h-[180px] flex-shrink-0 relative rounded-[16px] overflow-hidden shadow-md">
          <Image
            src="/img/profile_pic.png" // User's profile image
            alt="Nguyễn Danh Dương Profile Picture"
            fill
            className="object-cover" // Ensure image covers the div
            sizes="(max-width: 768px) 100vw, 180px"
          />
        </div>

        {/* Profile Information and Links Column */}
        <div className="flex-1 flex flex-col w-full">
          {/* Info Grid: Two columns of labels and values, matching the image data. */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-6 w-full mb-10">
            {/* Fullname */}
            <div>
              <p className="text-gray-600 text-[14px]">Fullname</p>
              <p className="font-semibold text-black text-[16px]">
                Nguyễn Danh Dương
              </p>
            </div>
            {/* Date of Birth */}
            <div>
              <p className="text-gray-600 text-[14px]">Date of birth</p>
              <p className="font-semibold text-black text-[16px]">30/06/2004</p>
            </div>
            {/* Student ID */}
            <div>
              <p className="text-gray-600 text-[14px]">Student ID</p>
              <p className="font-semibold text-black text-[16px]">B22DCPT043</p>
            </div>
            {/* Class ID */}
            <div className="flex flex-col justify-end">
              <p className="text-gray-600 text-[14px]">Class ID</p>
              <p className="font-semibold text-black text-[16px]">
                D22PTDPT02-B
              </p>
            </div>
          </div>

          {/* "My Work" Section: Links to various platforms in a blue panel. */}
          <div className="w-full">
            {/* Centered label for the work panel */}
            <h3 className="font-bold text-black text-[16px] text-center mb-4">
              My work
            </h3>

            {/* Blue Panel: background color #1c274c, padding, and flex alignment. */}
            <div className="bg-[#1c274c] rounded-[12px] p-5 flex justify-around items-center w-full">
              {/* Report (Báo cáo) link with its icon and label */}
              <a
                href="https://docs.google.com/document/d/1q30O2xKL7SJtudAHI6mpZeijDgb39m5T_QSdaiyt1MI/edit?usp=sharing"
                className="flex flex-col items-center gap-2 group"
                aria-label="Báo cáo"
              >
                <div className="w-8 h-8 relative">
                  <Image
                    src="/img/docs.png" // Icon from image
                    alt="Docs Icon"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-[#e2e8f0] text-[13px] font-medium">
                  Báo cáo
                </span>
              </a>

              {/* Github link with its icon and label */}
              <a
                href="https://github.com/Dstudy/IOT-Smart-Home"
                className="flex flex-col items-center gap-2 group"
                aria-label="Github"
              >
                <div className="w-8 h-8 relative">
                  <Image
                    src="/img/github.png" // Icon from image
                    alt="Github Icon"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-[#e2e8f0] text-[13px] font-medium">
                  Github
                </span>
              </a>

              {/* Api docs link with its icon and label */}
              <a
                href="http://localhost:5000/api-docs"
                className="flex flex-col items-center gap-2 group"
                aria-label="Api docs"
              >
                <div className="w-8 h-8 relative">
                  <Image
                    src="/img/api.png" // Icon from image
                    alt="Api docs Icon"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-[#e2e8f0] text-[13px] font-medium">
                  Api docs
                </span>
              </a>

              {/* Figma link with its icon and label */}
              <a
                href="https://www.figma.com/design/vsgfi1zG3vGpbgOcsgicOY/IOT?node-id=0-1&p=f&t=ZTfRDcy23tVDXgxz-0"
                className="flex flex-col items-center gap-2 group"
                aria-label="Figma"
              >
                <div className="w-8 h-8 relative">
                  <Image
                    src="/img/figma.png" // Icon from image
                    alt="Figma Icon"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-[#e2e8f0] text-[13px] font-medium">
                  Figma
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
