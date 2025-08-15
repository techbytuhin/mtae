import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';

const socialIcons: { [key: string]: { icon: React.FC<any>, color: string } } = {
  facebook: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>,
    color: 'hover:text-[#1877F2]'
  },
  twitter: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    color: 'hover:text-[#1DA1F2]'
  },
  instagram: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.013-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218 1.791.465 2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427.465C9.53 2.013 9.884 2 12.315 2zM12 7a5 5 0 100 10 5 5 0 000-10zm0-2a7 7 0 110 14 7 7 0 010-14zm6.406-1.185a1.285 1.285 0 10-2.57 0 1.285 1.285 0 002.57 0z" clipRule="evenodd" /></svg>,
    color: 'hover:text-[#E4405F]'
  },
  linkedin: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>,
    color: 'hover:text-[#0A66C2]'
  },
  youtube: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>,
    color: 'hover:text-[#FF0000]'
  },
  whatsapp: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.31 20.62C8.75 21.41 10.36 21.86 12.04 21.86C17.5 21.86 21.95 17.41 21.95 11.95C21.95 6.49 17.5 2 12.04 2ZM12.04 20.13C10.56 20.13 9.12 19.72 7.89 19L7.5 18.78L4.32 19.68L5.26 16.6L4.98 16.22C4.13 14.87 3.68 13.34 3.68 11.91C3.68 7.33 7.45 3.56 12.04 3.56C16.63 3.56 20.4 7.33 20.4 11.95C20.4 16.57 16.63 20.13 12.04 20.13ZM17.33 14.25C17.07 14.12 15.82 13.5 15.58 13.41C15.33 13.32 15.15 13.27 14.98 13.52C14.8 13.77 14.29 14.33 14.14 14.49C13.98 14.66 13.83 14.68 13.58 14.59C13.33 14.5 12.42 14.19 11.36 13.25C10.51 12.49 9.93 11.59 9.78 11.34C9.62 11.09 9.74 10.98 9.87 10.85C9.98 10.74 10.12 10.55 10.27 10.39C10.42 10.23 10.47 10.12 10.58 9.91C10.68 9.71 10.63 9.53 10.55 9.38C10.47 9.23 14.98 8.04 14.98 8.04C14.47 7.55 14.47 7.55 13.58 7.55C13.38 7.55 13.08 7.59 12.87 7.62C12.41 7.7 11.12 8.24 10.13 9.4C9.29 10.39 8.65 11.38 8.71 12.55C8.77 13.72 9.81 14.71 9.96 14.86C10.11 15.01 11.33 16.24 12.83 16.92C13.53 17.24 14.04 17.42 14.42 17.55C14.96 17.72 15.57 17.69 16.01 17.53C16.51 17.35 17.5 16.78 17.75 16.51C17.99 16.24 17.99 15.99 17.94 15.89C17.88 15.78 17.58 15.68 17.33 15.55L17.33 14.25Z"/></svg>,
    color: 'hover:text-[#25D366]'
  },
  telegram: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.69 6.64l-1.76 8.21c-.15.7-.63 1.05-1.28.65l-2.73-2.02-1.32 1.27c-.24.24-.44.44-.79.44l.16-2.79 5.03-4.53c.21-.19-.04-.3-.32-.12L8.01 13.7l-2.67-.83c-.69-.21-.71-.7.15-1.03l10.4-4.04c.57-.22 1.05.14.85.84z"/></svg>,
    color: 'hover:text-[#2AABEE]'
  },
  gmail: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"/></svg>,
    color: 'hover:text-[#D44638]'
  },
  website: {
    icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
    color: 'hover:text-gray-500'
  }
};

const Footer: React.FC = () => {
  const { state } = useContext(AppContext);
  const { t } = useTranslation();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
      <div className="container mx-auto px-4 text-sm text-gray-600 dark:text-gray-400 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© 2025 {state.settings.shopName}. All Rights Reserved.</p>
            <div className="flex space-x-6">
              {state.settings.socialLinks.map(link => {
                const SocialIcon = socialIcons[link.platform];
                if (!SocialIcon) return null;
                return (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`transition-colors duration-300 ${SocialIcon.color}`} aria-label={link.platform}>
                    <SocialIcon.icon className="h-6 w-6" />
                  </a>
                );
              })}
            </div>
        </div>
        <div className="text-center">
            <p>
              {t('developed_by')} <span className="font-semibold">{state.settings.developerName}</span> ({state.settings.developerCompany})
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;