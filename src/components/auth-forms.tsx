"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { HeartIcon } from "@/components/icons";
import { registerUser, loginUser, User } from "@/lib/storage";

interface AuthFormsProps {
  onSuccess: (user: User) => void;
}

export function AuthForms({ onSuccess }: AuthFormsProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginUser(email, password);
        if ("error" in result) {
          setError(result.error);
        } else {
          onSuccess(result);
        }
      } else {
        if (!name.trim()) {
          setError("Por favor, insira seu nome");
          setIsLoading(false);
          return;
        }
        const result = await registerUser(name, email, password);
        if ("error" in result) {
          setError(result.error);
        } else {
          onSuccess(result);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HeartIcon className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">NósDois</h1>
          <p className="text-muted-foreground">Conecte-se com seu amor</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-serif text-2xl">
              {isLogin ? "Entrar" : "Criar Conta"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Entre para ver a pergunta de hoje" 
                : "Crie sua conta para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                {!isLogin && (
                  <Field>
                    <FieldLabel htmlFor="name">Seu Nome</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Como você quer ser chamado(a)?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary/50"
                    />
                  </Field>
                )}
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/50"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={4}
                    className="bg-secondary/50"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin 
                  ? "Não tem conta? Criar agora" 
                  : "Já tem conta? Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
