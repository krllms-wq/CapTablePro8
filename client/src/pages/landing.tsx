import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { ArrowRight, Users, TrendingUp, Shield, Calculator, Smartphone, BarChart3, FileText, Zap, CheckCircle } from "lucide-react";
import dashboardScreenshot from "@assets/generated_images/Cap_table_dashboard_interface_5d46ff51.png";
import mobileScreenshot from "@assets/generated_images/Mobile_cap_table_interface_8346c84d.png";
import modelingScreenshot from "@assets/generated_images/Funding_round_modeling_interface_c964ab35.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data: any) => {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Invalidate auth queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      // Small delay to ensure localStorage is written
      setTimeout(() => {
        window.location.href = "/companies";
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
      return await apiRequest("/api/auth/register", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (data: any) => {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Invalidate auth queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Account created!",
        description: "Welcome to CapTable Pro. Your account has been created successfully.",
      });
      // Small delay to ensure localStorage is written
      setTimeout(() => {
        window.location.href = "/companies";
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (isLogin) {
        const validated = loginSchema.parse({
          email: formData.email,
          password: formData.password,
        });
        loginMutation.mutate(validated);
      } else {
        const validated = registerSchema.parse(formData);
        registerMutation.mutate(validated);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Mobile-First Hero Section */}
      <div className="lg:hidden px-4 pt-8 pb-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">CapTable Pro</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 leading-tight">
            Управляйте капитализацией
            <span className="text-primary block">с профессиональной точностью</span>
          </h2>
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            Комплексная платформа для стартапов: отслеживание долей, управление стейкхолдерами, 
            моделирование раундов и соблюдение требований.
          </p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen items-center justify-center p-8">
        <div className="max-w-7xl w-full flex items-center justify-between">
          {/* Hero Content */}
          <div className="flex-1 max-w-3xl pr-12">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white h-6 w-6" />
                </div>
                <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">CapTable Pro</h1>
              </div>
              
              <h2 className="text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 leading-tight">
                Управляйте капитализацией с
                <span className="text-primary"> профессиональной точностью</span>
              </h2>
              
              <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                Комплексная платформа для стартапов: отслеживание долей, управление стейкхолдерами, 
                моделирование раундов инвестиций и поддержание соответствия требованиям с расширенным планированием сценариев.
              </p>
            </div>
          </div>

          {/* Auth Form */}
          <div className="w-96 flex-shrink-0">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm dark:bg-neutral-800/90">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-neutral-900 dark:text-neutral-100">
                  {isLogin ? "Войти" : "Создать аккаунт"}
                </CardTitle>
                <CardDescription className="dark:text-neutral-400">
                  {isLogin 
                    ? "С возвращением! Войдите для доступа к вашим таблицам капитализации." 
                    : "Присоединяйтесь к тысячам основателей, управляющих своими долями с CapTable Pro."
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="Имя"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className={`touch-target ${errors.firstName ? "border-red-500" : ""}`}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="Фамилия"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className={`touch-target ${errors.lastName ? "border-red-500" : ""}`}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`touch-target ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Input
                      type="password"
                      placeholder="Пароль"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`touch-target ${errors.password ? "border-red-500" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full touch-target" 
                    disabled={loginMutation.isPending || registerMutation.isPending}
                  >
                    {loginMutation.isPending || registerMutation.isPending 
                      ? "Обработка..." 
                      : isLogin ? "Войти" : "Создать аккаунт"
                    }
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                        setFormData({ email: "", password: "", firstName: "", lastName: "" });
                      }}
                      className="ml-1 text-primary hover:underline font-medium"
                    >
                      {isLogin ? "Зарегистрироваться" : "Войти"}
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Auth Form */}
      <div className="lg:hidden px-4 pb-8">
        <Card className="shadow-xl bg-white/95 backdrop-blur-sm dark:bg-neutral-800/95">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100">
              {isLogin ? "Войти" : "Создать аккаунт"}
            </CardTitle>
            <CardDescription className="text-sm dark:text-neutral-400">
              {isLogin 
                ? "Войдите для доступа к вашим таблицам" 
                : "Присоединяйтесь к CapTable Pro"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Имя"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={`touch-target ${errors.firstName ? "border-red-500" : ""}`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                  <Input
                    type="text"
                    placeholder="Фамилия"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={`touch-target ${errors.lastName ? "border-red-500" : ""}`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              )}
              
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`touch-target ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`touch-target ${errors.password ? "border-red-500" : ""}`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full touch-target text-base" 
                disabled={loginMutation.isPending || registerMutation.isPending}
              >
                {loginMutation.isPending || registerMutation.isPending 
                  ? "Обработка..." 
                  : isLogin ? "Войти" : "Создать аккаунт"
                }
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {isLogin ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setFormData({ email: "", password: "", firstName: "", lastName: "" });
                  }}
                  className="ml-1 text-primary hover:underline font-medium"
                >
                  {isLogin ? "Зарегистрироваться" : "Войти"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Showcase Section */}
      <div className="px-4 lg:px-8 py-12 lg:py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h3 className="text-2xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Полный функционал для управления капитализацией
            </h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
              Все инструменты, необходимые для точного отслеживания долей, моделирования инвестиций 
              и управления стейкхолдерами в одной интуитивной платформе.
            </p>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-neutral-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Управление стейкхолдерами
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Централизованная база данных всех акционеров, инвесторов и опционщиков с детальной 
                  информацией о каждом участнике и их долях в компании.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-neutral-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Моделирование раундов
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Создавайте и сравнивайте различные сценарии инвестиций с расчетом размывания долей, 
                  пре- и пост-money оценок, влияния на текущих акционеров.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-neutral-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Отслеживание долей
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Автоматические расчеты долей владения с учетом всех типов инструментов: 
                  обыкновенные акции, опционы, SAFE, конвертируемые займы.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-neutral-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  История транзакций
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Полная история всех операций с акциями: эмиссии, передачи, исполнение опционов, 
                  конверсии SAFE с временными метками и аудитом.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-neutral-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Соблюдение требований
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Встроенные проверки соответствия корпоративному законодательству, 
                  автоматические уведомления и подготовка отчетности для регуляторов.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-neutral-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  Мобильный доступ
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Полноценный доступ ко всем функциям с любого устройства. 
                  Оптимизированный интерфейс для планшетов и смартфонов.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Screenshots Section */}
          <div className="space-y-12 lg:space-y-20">
            {/* Desktop Dashboard */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h4 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Профессиональный дашборд
                </h4>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
                  Получайте полное представление о структуре капитала компании с интерактивными 
                  таблицами, графиками и аналитикой в реальном времени.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Визуализация данных в реальном времени</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Интерактивные таблицы и графики</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Экспорт и печать отчетов</span>
                  </div>
                </div>
              </div>
              <div className="order-first lg:order-last">
                <img 
                  src={dashboardScreenshot} 
                  alt="Дашборд таблицы капитализации" 
                  className="rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full"
                />
              </div>
            </div>

            {/* Mobile Interface */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="flex justify-center">
                <div className="max-w-sm">
                  <img 
                    src={mobileScreenshot} 
                    alt="Мобильный интерфейс" 
                    className="rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full"
                  />
                </div>
              </div>
              <div>
                <h4 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Удобство на любом устройстве
                </h4>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
                  Полный функционал доступен с телефона или планшета. Отзывчивый дизайн 
                  и оптимизация для сенсорных экранов обеспечивают комфортную работу везде.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Сенсорно-дружелюбный интерфейс</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Оптимизация для iOS и Android</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Офлайн-режим для просмотра данных</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modeling Interface */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h4 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Продвинутое моделирование
                </h4>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6">
                  Создавайте детальные сценарии инвестиций с поддержкой множественных инвесторов, 
                  сравнением до/после и расчетом влияния на всех стейкхолдеров.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Сравнение до/после инвестиций</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Расчет размывания долей</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-neutral-700 dark:text-neutral-300">Сохранение и загрузка сценариев</span>
                  </div>
                </div>
              </div>
              <div className="order-first lg:order-last">
                <img 
                  src={modelingScreenshot} 
                  alt="Интерфейс моделирования раундов" 
                  className="rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 lg:px-8 py-12 lg:py-20 bg-gradient-to-r from-primary to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl lg:text-4xl font-bold text-white mb-4">
            Начните управлять капитализацией профессионально
          </h3>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к сотням стартапов, которые доверяют CapTable Pro 
            управление своими таблицами капитализации и планирование инвестиций.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="touch-target text-lg px-8 py-4"
            onClick={() => {
              document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Начать бесплатно
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}