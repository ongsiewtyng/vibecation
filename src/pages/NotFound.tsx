import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white font-serif">
            <div className="max-w-2xl text-center px-6">
                {/* Background GIF Section */}
                <div
                    className="w-full h-[350px] md:h-[420px] bg-center bg-cover flex items-center justify-center"
                    style={{
                        backgroundImage:
                            "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')",
                    }}
                >
                    <h1 className="text-8xl md:text-[150px] font-extrabold text-white drop-shadow-xl">
                        404
                    </h1>
                </div>

                {/* Text Section */}
                <div className="-mt-6 md:-mt-10">
                    <h3 className="text-3xl md:text-4xl font-semibold mb-4">
                        Looks like you're lost
                    </h3>
                    <p className="text-lg md:text-xl text-gray-600 mb-8">
                        The page you are looking for is not available!
                    </p>

                    {/* Button */}
                    <Link
                        to="/"
                        className="bg-green-600 text-white px-8 py-3 text-lg md:text-xl rounded-lg
                        hover:bg-green-700 transition shadow-lg"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
