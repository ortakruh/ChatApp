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
            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
          </svg>
          <span className="discord-text-white font-bold text-xl">Discord</span>
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
          GROUP CHAT<br/>
          THAT'S ALL<br/>
          <span className="text-yellow-300">FUN & GAMES</span>
        </h1>
        
        <p className="discord-text-white text-lg lg:text-xl mb-12 max-w-2xl mx-auto opacity-90">
          Discord is great for playing games and chilling with friends, or even building a worldwide community. 
          Customize your own space to talk, play, and hang out.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="bg-white text-[hsl(235,86%,65%)] hover:bg-gray-100 px-8 py-3 rounded-full font-medium">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
            </svg>
            Download for Windows
          </Button>
          <Button 
            onClick={() => navigate("/auth")}
            variant="secondary"
            className="discord-bg-darkest discord-text-white hover:bg-opacity-80 px-8 py-3 rounded-full font-medium"
          >
            Open Discord in your browser
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
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold">Discord App Preview</h3>
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
