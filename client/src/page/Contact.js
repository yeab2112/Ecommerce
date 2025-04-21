import React from 'react';
import NewsLeterBox from '../component/NewsLeterBox';
import Title from '../component/Title';
import contact from '../image/contact.png';

const Contact = () => {
  return (
    <div className="w-full max-w-[3000px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-12 lg:py-20">
      {/* Title Section */}
      <div className="mb-16 lg:mb-20">
        <Title title1="CONTACT" title2="US" />
      </div>

      {/* Main Content - Ultra Wide Layout */}
      <div className="flex flex-col xl:flex-row gap-16 xl:gap-24 items-center">
        {/* Image Section - Expanded */}
        <div className="w-full xl:w-[55%] 2xl:w-[60%]">
          <img
            src={contact}
            alt="Our store location in Addis Ababa"
            className="w-full h-auto max-h-[600px] 2xl:max-h-[700px] object-cover rounded-2xl shadow-xl transition-transform duration-500 hover:scale-[1.02]"
            loading="lazy"
          />
        </div>

        {/* Contact Info Section - Expanded */}
        <div className="w-full xl:w-[45%] 2xl:w-[40%] space-y-10 2xl:space-y-12">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-blue-700">Our Store Information</h2>

          {/* Contact Items - Larger */}
          <div className="space-y-8 2xl:space-y-10">
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
                value: 'Monday - Friday: 9 AM - 6 PM\nSaturday: 10 AM - 4 PM'
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-6">
                <span className="text-3xl 2xl:text-4xl">{item.icon}</span>
                <div>
                  <p className="text-xl lg:text-2xl xl:text-3xl font-medium text-gray-800">
                    {item.label}{' '}
                    {item.link ? (
                      <a 
                        href={item.link} 
                        className="text-blue-600 hover:underline hover:text-blue-700"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-gray-600 whitespace-pre-line">{item.value}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons - Larger */}
          <div className="flex flex-wrap gap-6 pt-8">
            <a
              href="/careers"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg lg:text-xl py-4 px-10 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Explore Career Opportunities
            </a>
            <a
              href="https://wa.me/251923547840"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold text-lg lg:text-xl py-4 px-10 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Map Section - Expanded */}
      <div className="mt-20 2xl:mt-24">
        <h3 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-700 mb-10">Find Us On The Map</h3>
        <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl">
          <iframe
            title="Addis Zemmen Store Location Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3941.4891325496587!2d38.74047197413468!3d8.926992790579199!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8334bbe244d1%3A0x19fa020258e33bb5!2zSGFuYSBtYXJpeWFtIC0g4YiQ4YqTIOGIm-GIreGLq-GInSDhiaThibDhiq3hiK3hiLXhibLhi6vhipU!5e0!3m2!1sen!2set!4v1741565993310!5m2!1sen!2set"
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-[400px] lg:h-[500px] 2xl:h-[600px]"
          />
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="mt-20 2xl:mt-24">
        <NewsLeterBox />
      </div>
    </div>
  );
};

export default Contact;