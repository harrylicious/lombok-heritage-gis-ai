import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, Database as DatabaseIcon, Tag, Users, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SitesManagement from "@/pages/SitesManagement";
import CategoriesManagement from "@/pages/CategoriesManagement";
import CulturalPracticesManagement from "@/pages/CulturalPracticesManagement";
import ReviewsModeration from "@/components/ReviewsModeration";

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState("sites");
  const navigate = useNavigate();

  const handleLogout = async () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-cultural">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Panel Warisan Budaya</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground hidden sm:flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Panel Admin</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Keluar
            </Button>
          </div>
        </div>

        {/* Top Navigation Bar */}
        <Card className="p-4 bg-background/80 backdrop-blur-sm shadow-cultural">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-6">
              <Button
                variant={activeTab === "sites" ? "default" : "ghost"}
                onClick={() => setActiveTab("sites")}
                className="flex items-center gap-2"
              >
                <DatabaseIcon className="w-4 h-4" />
                Situs Budaya
              </Button>
              <Button
                variant={activeTab === "categories" ? "default" : "ghost"}
                onClick={() => setActiveTab("categories")}
                className="flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                Kategori
              </Button>
              <Button
                variant={activeTab === "practices" ? "default" : "ghost"}
                onClick={() => setActiveTab("practices")}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Praktik Budaya
              </Button>
              <Button
                variant={activeTab === "reviews" ? "default" : "ghost"}
                onClick={() => setActiveTab("reviews")}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Moderasi Ulasan
              </Button>
            </nav>
          </div>
        </Card>

        {/* Content based on active tab */}
        {activeTab === "sites" && <SitesManagement />}
        {activeTab === "categories" && <CategoriesManagement />}
        {activeTab === "practices" && <CulturalPracticesManagement />}
        {activeTab === "reviews" && <ReviewsModeration />}
      </div>
    </div>
  );
};

export default Admin;
