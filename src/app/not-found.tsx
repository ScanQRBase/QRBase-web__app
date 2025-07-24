'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="w-screen min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6 text-center">
      <Image
        src="https://ik.imagekit.io/cafu/$SCAN/not-found.png?updatedAt=1747921735503&ik-s=0a708634318666dd5210bc4e2524c1a55eda2022"
        alt="404 Logo"
        width={300}
        height={300}
        className="mb-6"
        style={{ borderRadius: '10px' }}
      />
      <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-6 text-lg">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        style={{ borderRadius: '10px' }}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition inline-block"
      >
        Go Home
      </Link>
    </div>
  );
}
