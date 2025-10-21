import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Homepage from "@/pages/Homepage";
import StudentDashboard from "@/pages/StudentDashboard";
import TutorDashboard from "@/pages/TutorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import CourseDetail from "@/pages/CourseDetail";
import CourseList from "@/pages/CourseList";

function App() {
  const [currentView, setCurrentView] = useState<"student" | "tutor" | "admin">("student");
  const [currentPage, setCurrentPage] = useState<"homepage" | "dashboard" | "courses" | "course-detail" | "assignments" | "announcements" | "students" | "analytics" | "users" | "settings">("homepage");

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const userNames = {
    student: "James Omondi",
    tutor: "Dr. Sarah Kamau",
    admin: "System Administrator",
  };

  const handleSidebarNavigation = (page: string) => {
    setCurrentPage(page as any);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar userRole={currentView} userName={userNames[currentView]} onNavigate={handleSidebarNavigation} currentPage={currentPage} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-4 p-4 border-b-2 border-green-300 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
                <div className="flex items-center gap-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white hover:bg-green-800" />
                  <div className="hidden md:block">
                    <h2 className="font-bold text-lg text-white">NYS Virtual Campus</h2>
                    <p className="text-sm text-green-100">National Youth Service Kenya</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Card className="px-4 py-2 bg-white/10 border border-white/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Role:</span>
                      <Badge variant="outline" className="text-sm px-3 py-1 border border-white bg-white/20 text-white font-bold">{currentView}</Badge>
                    </div>
                  </Card>
                  <ThemeToggle />
                </div>
              </header>

              <div className="flex-1 overflow-auto bg-background">
                <div className="container mx-auto p-6 max-w-7xl">
                  {/* Role switcher with NYS Kenya theme */}
                  <Card className="mb-6 border-2 border-green-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                      <CardTitle className="text-lg font-bold">Switch User Role</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
                        <TabsList className="grid w-full grid-cols-3 bg-green-100">
                          <TabsTrigger 
                            value="student" 
                            data-testid="tab-role-student"
                            className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-semibold"
                          >
                            Student
                          </TabsTrigger>
                          <TabsTrigger 
                            value="tutor" 
                            data-testid="tab-role-tutor"
                            className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-semibold"
                          >
                            Tutor
                          </TabsTrigger>
                          <TabsTrigger 
                            value="admin" 
                            data-testid="tab-role-admin"
                            className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-semibold"
                          >
                            Admin
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {currentPage === "homepage" && (
                    <Homepage 
                      userRole={currentView} 
                      userName={userNames[currentView]} 
                      onNavigate={handleSidebarNavigation} 
                    />
                  )}

                  {currentPage === "dashboard" && (
                    <>
                      {currentView === "student" && <StudentDashboard />}
                      {currentView === "tutor" && <TutorDashboard />}
                      {currentView === "admin" && <AdminDashboard />}
                    </>
                  )}

                  {currentPage === "courses" && <CourseList />}
                  {currentPage === "course-detail" && <CourseDetail />}
                  
                  {/* Student specific pages */}
                  {currentView === "student" && currentPage === "assignments" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">My Assignments</h1>
                      <p className="text-muted-foreground">View and submit your assignments here.</p>
                    </div>
                  )}
                  
                  {currentView === "student" && currentPage === "announcements" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">Announcements</h1>
                      <p className="text-muted-foreground">Stay updated with the latest announcements.</p>
                    </div>
                  )}

                  {/* Tutor specific pages */}
                  {currentView === "tutor" && currentPage === "assignments" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">Assignment Management</h1>
                      <p className="text-muted-foreground">Create and manage assignments for your students.</p>
                    </div>
                  )}
                  
                  {currentView === "tutor" && currentPage === "students" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">My Students</h1>
                      <p className="text-muted-foreground">View and manage your students.</p>
                    </div>
                  )}
                  
                  {currentView === "tutor" && currentPage === "analytics" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">Analytics</h1>
                      <p className="text-muted-foreground">View performance analytics and insights.</p>
                    </div>
                  )}

                  {/* Admin specific pages */}
                  {currentView === "admin" && currentPage === "users" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">User Management</h1>
                      <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
                    </div>
                  )}
                  
                  {currentView === "admin" && currentPage === "analytics" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">System Analytics</h1>
                      <p className="text-muted-foreground">View system-wide analytics and reports.</p>
                    </div>
                  )}
                  
                  {currentView === "admin" && currentPage === "settings" && (
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold">System Settings</h1>
                      <p className="text-muted-foreground">Configure system settings and preferences.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
