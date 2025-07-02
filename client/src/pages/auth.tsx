import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { insertUserSchema, loginUserSchema, type InsertUser, type LoginUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [rememberMe, setRememberMe] = useState(false);

  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginUser) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (user) => {
      auth.setCurrentUser(user, rememberMe);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      navigate("/app");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (user) => {
      auth.setCurrentUser(user);
      toast({
        title: "Account created!",
        description: "Welcome to Discord!",
      });
      navigate("/app");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen discord-gradient relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-500 rounded-full opacity-25 blur-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-blue-400 rounded-full opacity-15 blur-2xl"></div>
      </div>

      {/* ChatApp Logo */}
      <div className="absolute top-6 left-6 flex items-center space-x-2">
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="discord-text-white font-bold text-xl">ChatApp</span>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-6xl">

          {/* Auth Form */}
          <Card className="discord-bg-dark w-full max-w-md">
            <CardContent className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-white data-[state=active]:text-[hsl(235,86%,65%)]"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="data-[state=active]:bg-white data-[state=active]:text-[hsl(235,86%,65%)]"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <div className="mb-6">
                    <h2 className="discord-text-white text-2xl font-bold mb-2">Welcome back!</h2>
                    <p className="discord-text mb-6">We're so excited to see you again!</p>
                  </div>

                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="emailOrUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              EMAIL OR PHONE NUMBER <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Enter your email or phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              PASSWORD <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="password"
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Enter your password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="rememberMe"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                          className="border-[hsl(235,86%,65%)] data-[state=checked]:bg-[hsl(235,86%,65%)]"
                        />
                        <Label htmlFor="rememberMe" className="discord-text text-sm">
                          Remember me
                        </Label>
                      </div>

                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-[hsl(235,86%,65%)] hover:underline p-0 h-auto"
                      >
                        Forgot your password?
                      </Button>

                      <Button 
                        type="submit" 
                        className="w-full discord-primary discord-primary-hover text-white py-3 mt-6 font-medium"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Log In"}
                      </Button>

                      <p className="discord-text text-xs mt-4 mb-2">
                        Note: Password must match your name or email to continue
                      </p>

                      <p className="discord-text text-sm mt-4">
                        Need an account? <Button type="button" variant="link" onClick={() => setActiveTab("register")} className="text-[hsl(235,86%,65%)] hover:underline p-0 h-auto">Register</Button>
                      </p>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <div className="mb-6">
                    <h2 className="discord-text-white text-2xl font-bold">Create an account</h2>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              EMAIL <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="email"
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Enter your email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              DISPLAY NAME
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                value={field.value || ""}
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Enter your display name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              USERNAME <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Enter your username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              PASSWORD <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="password"
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Enter your password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="discord-text text-sm font-medium">
                              CONFIRM PASSWORD <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                type="password"
                                className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                                placeholder="Confirm your password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <p className="discord-text text-xs mb-4">
                        By registering, you agree to Discord's <Button variant="link" className="text-[hsl(235,86%,65%)] hover:underline p-0 h-auto text-xs">Terms of Service</Button> and <Button variant="link" className="text-[hsl(235,86%,65%)] hover:underline p-0 h-auto text-xs">Privacy Policy</Button>.
                      </p>

                      <Button 
                        type="submit" 
                        className="w-full discord-primary discord-primary-hover text-white py-3 font-medium"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Continue"}
                      </Button>

                      <p className="discord-text text-sm mt-4">
                        <Button type="button" variant="link" onClick={() => setActiveTab("login")} className="text-[hsl(235,86%,65%)] hover:underline p-0 h-auto">Already have an account?</Button>
                      </p>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block mb-4">
              <div className="w-48 h-48 bg-black flex items-center justify-center">
                <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <h3 className="discord-text-white text-xl font-semibold mb-2">Log in with QR Code</h3>
            <p className="discord-text max-w-xs">
              Scan this with the <strong>ChatApp mobile app</strong> to log in instantly.
            </p>
            <Button variant="link" className="text-[hsl(235,86%,65%)] hover:underline text-sm mt-2">
              Or log in with passkey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}