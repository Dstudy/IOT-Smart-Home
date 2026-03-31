import React from 'react';
import Image from 'next/image';

export default function ProfilePage() {
    return (
        <div className="p-8 md:p-10 w-full max-w-screen-2xl mx-auto min-h-full flex flex-col">
            <h1 className="text-[32px] font-bold text-black mb-8">
                Profile
            </h1>

            <div className="bg-[#f9fafb] md:bg-white rounded-[24px] shadow-sm p-6 md:p-10 xl:p-12 flex flex-col lg:flex-row gap-10 xl:gap-16 items-stretch border border-gray-100">
                {/* Left: Profile Image */}
                <div className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0">
                    <div className="w-full aspect-[4/4.5] relative rounded-[24px] overflow-hidden shadow-sm">
                        <Image
                            src="/img/profile_pic.png"
                            alt="Profile Picture"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 380px"
                        />
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 flex flex-col justify-between py-2">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-10 lg:mb-0">
                        <div>
                            <p className="text-gray-600 text-[15px] mb-1.5">Fullname</p>
                            <p className="font-bold text-black text-xl">Nguyễn Danh Dương</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-[15px] mb-1.5">Date of birth</p>
                            <p className="font-bold text-black text-xl">30/06/2004</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-[15px] mb-1.5">Student ID</p>
                            <p className="font-bold text-black text-xl">B22DCPT043</p>
                        </div>
                        <div className="flex flex-col justify-end">
                            <p className="font-bold text-black text-xl">D22PTDPT02-B</p>
                        </div>
                    </div>

                    {/* My Work Section */}
                    <div className="mt-auto">
                        <h3 className="font-bold text-black text-[17px] text-center mb-5 tracking-tight">
                            My work
                        </h3>
                        <div className="bg-[#1c274c] rounded-[20px] p-6 lg:p-8 flex justify-around items-center">
                            <a href="#"
                                className="flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform group"
                                aria-label="Báo cáo">
                                <div className="w-10 h-10 relative">
                                    <Image src="/img/docs.png" alt="Báo cáo" fill className="object-contain group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[#e2e8f0] text-[15px] font-medium">Báo cáo</span>
                            </a>
                            <a href="#"
                                className="flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform group"
                                aria-label="Github">
                                <div className="w-10 h-10 relative">
                                    <Image src="/img/github.png" alt="Github" fill className="object-contain group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[#e2e8f0] text-[15px] font-medium">Github</span>
                            </a>
                            <a href="#"
                                className="flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform group"
                                aria-label="Api docs">
                                <div className="w-10 h-10 relative">
                                    <Image src="/img/api.png" alt="Api docs" fill className="object-contain group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[#e2e8f0] text-[15px] font-medium">Api docs</span>
                            </a>
                            <a href="#"
                                className="flex flex-col items-center gap-3 hover:-translate-y-1 transition-transform group"
                                aria-label="Figma">
                                <div className="w-10 h-10 relative">
                                    <Image src="/img/figma.png" alt="Figma" fill className="object-contain group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[#e2e8f0] text-[15px] font-medium">Figma</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
