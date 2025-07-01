import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen discord-gradient relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-500 rounded-full opacity-25 blur-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-400 rounded-full opacity-15 blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-purple-400 rounded-full opacity-30 blur-md"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="discord-text-white font-bold text-xl">ChatApp</span>
        </div>
        
        <div className="hidden lg:flex items-center space-x-8 discord-text-white">
          <a href="#" className="hover:underline">Download</a>
          <a href="#" className="hover:underline">Nitro</a>
          <a href="#" className="hover:underline">Discover</a>
          <a href="#" className="hover:underline">Safety</a>
          <a href="#" className="hover:underline">Support</a>
          <a href="#" className="hover:underline">Blog</a>
          <a href="#" className="hover:underline">Careers</a>
        </div>

        <Button 
          onClick={() => navigate("/auth")}
          className="bg-white text-[hsl(235,86%,65%)] hover:bg-gray-100 px-4 py-2 rounded-full font-medium"
        >
          Log In
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <h1 className="discord-text-white text-4xl lg:text-6xl font-bold mb-8 leading-tight">
          CONNECT<br/>
          CHAT<br/>
          <span className="text-yellow-300">COMMUNICATE</span>
        </h1>
        
        <p className="discord-text-white text-lg lg:text-xl mb-12 max-w-2xl mx-auto opacity-90">
          ChatApp brings people together through seamless communication. Create your perfect space to connect, 
          share, and build meaningful relationships with friends and communities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="bg-white text-[hsl(235,86%,65%)] hover:bg-gray-100 px-8 py-3 rounded-full font-medium">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
            </svg>
            Download ChatApp
          </Button>
          <Button 
            onClick={() => navigate("/auth")}
            variant="secondary"
            className="discord-bg-darkest discord-text-white hover:bg-opacity-80 px-8 py-3 rounded-full font-medium"
          >
            Open ChatApp in your browser
          </Button>
        </div>
      </div>

      {/* Illustration */}
      <div className="relative z-10 container mx-auto px-6 pb-20">
        <div className="mx-auto rounded-lg shadow-2xl max-w-4xl w-full bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-xl">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-[hsl(235,86%,65%)] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold">ChatApp Preview</h3>
                <p className="text-gray-400">Connect with friends and communities</p>
              </div>
            </div>
            <div className="text-center py-8 text-gray-400">
              Experience seamless communication with voice, video, and text chat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
