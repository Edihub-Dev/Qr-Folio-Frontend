import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const ProfileHeader = ({
  name,
  designation,
  companyName,
  avatar,
  socialLinks,
  contactItems,
}) => (
  <div className="space-y-6">
    <div className="rounded-[32px] bg-white p-8 shadow-[0_32px_60px_-20px_rgba(79,70,229,0.35)]">
      <div className="flex flex-col items-center text-center">
        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-[0_20px_40px_rgba(79,70,229,0.2)]">
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        </div>
        <div className="mt-6 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">{name}</h1>
          <p className="text-sm font-medium text-slate-500">
            {designation || "—"} at {companyName || "Company"}
          </p>
        </div>
        {socialLinks?.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map(({ key, href, label, bg, fg, icon: Icon }) => (
              <motion.a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} ${fg} text-[15px] shadow transition`}
                whileHover={{ y: -3 }}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{label}</span>
              </motion.a>
            ))}
          </div>
        )}
        {contactItems?.length > 0 && (
          <div className="mt-6 w-full space-y-3 text-left text-sm text-slate-600">
            {contactItems.map(({ key, icon: Icon, value }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="break-words">{value?.trim() || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

ProfileHeader.propTypes = {
  name: PropTypes.string.isRequired,
  designation: PropTypes.string,
  companyName: PropTypes.string,
  avatar: PropTypes.string.isRequired,
  socialLinks: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      bg: PropTypes.string.isRequired,
      fg: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ),
  contactItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      value: PropTypes.string,
    })
  ),
};

ProfileHeader.defaultProps = {
  designation: "",
  companyName: "",
  socialLinks: [],
  contactItems: [],
};

export default ProfileHeader;
