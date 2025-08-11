import React from 'react';
import NewsLeterBox from '../component/NewsLeterBox';
import Title from '../component/Title';
import contact from '../image/contact.png';

const Contact = () => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-12 lg:py-20 min-h-[60vh]">
      {/* Title */}
      <div className="mb-12 text-center">
        <Title title1="CONTACT" title2="US" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col xl:flex-row gap-12 xl:gap-20 items-start xl:items-center">
        {/* Image */}
        <div className="w-full xl:w-1/2">
          <img
            src={contact}
            alt="Contact"
            className="w-full h-auto max-h-[550px] object-cover rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Contact Details */}
        <div className="w-full xl:w-1/2 space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-blue-700">Our Store Information</h2>

          <div className="space-y-6">
            {[
              {
                icon: '📞',
                label: 'Phone:',
                value: '+251 923 547 840',
                link: 'tel:+251923547840'
              },
              {
                icon: '✉️',
                label: 'Email:',
                value: 'contact@addiszemmen.com',
                link: 'mailto:contact@addiszemmen.com'
              },
              {
                icon: '📍',
                label: 'Location:',
                value: 'Hana Mariam, Addis Ababa, Ethiopia'
              },
              {
                icon: '🕒',
                label: 'Business Hours:',
                value: 'Mon - Fri: 9 AM - 6 PM\nSat: 10 AM - 4 PM'
              }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-lg lg:text-xl font-medium text-gray-800">
                  {item.label}{' '}
                  {item.link ? (
                    <a href={item.link} className="text-blue-600 hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-gray-700 whitespace-pre-line">{item.value}</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Buttons - Side by Side */}
          <div className="flex flex-wrap gap-6 pt-6">
            <a
              href="/careers"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-3 px-6 rounded-lg transition-all shadow"
            >
              Career Opportunities
            </a>
            <a
              href="https://wa.me/251923547840"
              className="bg-green-500 hover:bg-green-600 text-white font-medium text-lg py-3 px-6 rounded-lg transition-all shadow"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <div className="mt-20">
        <h3 className="text-3xl font-bold text-blue-700 mb-6">Find Us On The Map</h3>
        <div className="rounded-xl overflow-hidden shadow-lg">
          <iframe
            title="Addis Zemmen Store Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3941.4891325496587!2d38.74047197413468!3d8.926992790579199!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8334bbe244d1%3A0x19fa020258e33bb5!2zSGFuYSBtYXJpeWFtIC0g4YiQ4YqTIOGIm-GIreGLq-GInSDhiaThibDhiq3hiK3hiLXhibLhi6vhipU!5e0!3m2!1sen!2set!4v1741565993310!5m2!1sen!2set"
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-[400px] lg:h-[500px]"
          />
        </div>
      </div>

      {/* Newsletter */}
      <div className="mt-20">
        <NewsLeterBox />
      </div>
    </div>
  );
};

export default Contact;
