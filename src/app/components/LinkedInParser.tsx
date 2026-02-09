"use client";

import { useState, useRef } from "react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface Profile {
  name: string | null;
  title: string | null;
  location: string | null;
  contact: {
    email: string | null;
    linkedin: string | null;
    company_website: string | null;
    portfolio: string | null;
    instagram: string | null;
  };
  top_skills: string[];
  languages: string[];
  summary: string | null;
  experience: {
    company: string | null;
    title: string | null;
    duration: string | null;
    location: string | null;
    description: string | null;
  }[];
  education: {
    institution: string | null;
    degree: string | null;
    years: string | null;
  }[];
  honors_awards: string[];
}

interface Props {
  /** Called when user clicks "Find Matching Jobs" — sends query to chat tab */
  onFindJobs?: (query: string) => void;
}

export default function LinkedInParser({ onFindJobs }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setProfile(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${basePath}/api/linkedin/parse`, {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        detail?: string;
        profile?: Profile;
      };

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setProfile(data.profile ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const downloadJson = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name?.replace(/\s+/g, "_") || "profile"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Build a job search query from the parsed profile */
  const buildJobQuery = (): string => {
    if (!profile) return "";

    const parts: string[] = [];

    // Use their current title as the primary search
    if (profile.title) {
      parts.push(profile.title);
    }

    // Add top skills for context
    if (profile.top_skills.length > 0) {
      const skills = profile.top_skills.slice(0, 3).join(", ");
      parts.push(`with skills in ${skills}`);
    }

    // Add location if available
    if (profile.location) {
      parts.push(`in ${profile.location}`);
    }

    return parts.length > 0
      ? `Find jobs for someone who is a ${parts.join(" ")}`
      : "Find jobs matching this candidate's profile";
  };

  const handleFindJobs = () => {
    const query = buildJobQuery();
    onFindJobs?.(query);
  };

  const reset = () => {
    setProfile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">
          Extracting profile data with AI — this takes 5-10 seconds...
        </p>
      </div>
    );
  }

  // ---- Results state ----
  if (profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleFindJobs}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            🔍 Find Matching Jobs
          </button>
          <button
            onClick={downloadJson}
            className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            ⬇ Download JSON
          </button>
          <button
            onClick={reset}
            className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            ↩ Parse Another
          </button>
        </div>

        {/* Job query preview */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          <span className="font-medium">Generated query: </span>
          {buildJobQuery()}
        </div>

        {/* Hero card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold">{profile.name || "Unknown"}</h2>
          {profile.title && (
            <p className="text-blue-600 font-medium mt-1">{profile.title}</p>
          )}
          {profile.location && (
            <p className="text-gray-500 text-sm mt-1">📍 {profile.location}</p>
          )}

          {/* Contact links */}
          <div className="flex flex-wrap gap-3 mt-4 text-sm">
            {profile.contact?.email && (
              <a
                href={`mailto:${profile.contact.email}`}
                className="text-blue-600 hover:underline"
              >
                ✉ {profile.contact.email}
              </a>
            )}
            {profile.contact?.linkedin && (
              <a
                href={profile.contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                🔗 LinkedIn
              </a>
            )}
            {profile.contact?.company_website && (
              <a
                href={profile.contact.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                🌐 Website
              </a>
            )}
            {profile.contact?.portfolio && (
              <a
                href={profile.contact.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                🎨 Portfolio
              </a>
            )}
          </div>
        </div>

        {/* Skills */}
        {profile.top_skills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Top Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.top_skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {profile.summary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Summary</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {profile.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {profile.experience.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Experience</h3>
            <div className="space-y-5 border-l-2 border-blue-100 pl-5">
              {profile.experience.map((exp, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[1.625rem] top-1 w-3 h-3 rounded-full bg-blue-600" />
                  <p className="font-medium">{exp.title}</p>
                  <p className="text-sm text-blue-600">{exp.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[exp.duration, exp.location].filter(Boolean).join(" · ")}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Education</h3>
            <div className="space-y-3">
              {profile.education.map((edu, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <p className="font-medium">{edu.institution}</p>
                  {edu.degree && (
                    <p className="text-sm text-gray-600">{edu.degree}</p>
                  )}
                  {edu.years && (
                    <p className="text-xs text-gray-400 mt-1">{edu.years}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Honors & Awards */}
        {profile.honors_awards.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Honors & Awards</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {profile.honors_awards.map((award, i) => (
                <li key={i}>{award}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ---- Upload state (default) ----
  return (
    <div className="max-w-2xl mx-auto px-4 py-24">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition ${
          dragActive
            ? "border-blue-600 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <p className="text-5xl mb-4">📄</p>
        <p className="text-lg font-medium text-gray-700">
          Drop a LinkedIn PDF here or click to upload
        </p>
        <p className="text-sm text-gray-400 mt-2">
          We&apos;ll extract their profile and find matching BrightSpring jobs
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

