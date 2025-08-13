import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Clock, Send, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Footer from '../components/Footer';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  message: string;
}

const ContactPage = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    if (!token) {
      setSubmitStatus('error');
      setSubmitMessage('Please verify you are not a robot.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      console.log('📧 Submitting contact form:', data);
      
      // Create the message content combining all form data
      const messageContent = `Event Type: ${data.eventType}
${data.eventDate ? `Preferred Date: ${data.eventDate}` : ''}
${data.phone ? `Phone: ${data.phone}` : ''}

Message:
${data.message}`;

      // Insert into contact_messages table
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: data.name,
          email: data.email,
          message: messageContent,
          status: 'unread'
        });

      if (error) {
        console.error('Error submitting contact form:', error);
        setSubmitStatus('error');
        setSubmitMessage('Failed to send message. Please try again or contact us directly.');
      } else {
        console.log('✅ Contact form submitted successfully');
        setSubmitStatus('success');
        setSubmitMessage('Thank you for your message! We\'ll get back to you within 24 hours.');
        reset();
        captchaRef.current?.resetCaptcha();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus('idle');
          setSubmitMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Unexpected error submitting contact form:', error);
      setSubmitStatus('error');
      setSubmitMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to capture your special moments? Let's discuss your photography needs and create something amazing together.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600">+91 (960) 305-1089</p>
                    <p className="text-sm text-gray-500">Available Mon-Fri, 9AM-6PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">hello@eventsnap.com</p>
                    <p className="text-sm text-gray-500">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Studio Location</h3>
                    <p className="text-gray-600">Visakhapatnam<br />Andhra Pradesh<br />India</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Business Hours</h3>
                    <div className="text-gray-600 text-sm">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p>Saturday: 10:00 AM - 4:00 PM</p>
                      <p>Sunday: By appointment only</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Overview */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-8 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Camera className="h-6 w-6" />
                <h3 className="text-xl font-bold">Why Choose Micheal photographs?</h3>
              </div>
              <ul className="space-y-3 text-blue-100">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Professional photography with 10+ years experience</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Quick turnaround - galleries ready within 48 hours</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>High-resolution images with unlimited downloads</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Competitive pricing with no hidden fees</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>QR code access for easy gallery sharing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    {...register('eventType', { required: 'Please select an event type' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="portrait">Portrait Session</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="graduation">Graduation</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.eventType && (
                    <p className="mt-1 text-sm text-red-600">{errors.eventType.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date
                </label>
                <input
                  {...register('eventDate')}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  {...register('message', { required: 'Please enter a message' })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your event, any specific requirements, and how we can help make it perfect..."
                ></textarea>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <HCaptcha
                sitekey="4d8e1b5c-3e96-4864-bc70-fc6e34726cce"
                onVerify={setToken}
                ref={captchaRef}
              />

              {/* Status Message */}
              {submitStatus !== 'idle' && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                  submitStatus === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {submitStatus === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">{submitMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2 ${
                  isSubmitting 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) :
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send Message</span>
                  </>
                }
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                <strong>Quick Response Guarantee:</strong> We'll get back to you within 24 hours with a detailed quote and availability information.
              </p>
            </div>
          </div>
        </div>
      </div>
<Footer />
    </div>
  );
};

export default ContactPage;
