import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 py-12 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
          Capture the Crowd with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">CrowdCanvas</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-gray-600">
          The ultimate centralized Event & Media Management Platform. 
          Upload, organize, access, and interact with media content seamlessly for clubs, photographers, and members.
        </p>
        <div className="flex items-center justify-center gap-x-6">
          <Link
            href="/events"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
          >
            Browse Events
          </Link>
          <Link
            href="/login"
            className="text-base font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-all"
          >
            Sign in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
