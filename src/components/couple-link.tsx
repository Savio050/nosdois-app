"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { HeartIcon, CopyIcon, CheckIcon, LinkIcon } from "@/components/icons";
import { linkPartner, User } from "@/lib/storage";

interface CoupleLinkProps {
  user: User;
  onLinked: (user: User) => void;
}

export function CoupleLink({ user, onLinked }: CoupleLinkProps) {
  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(user.coupleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await linkPartner(user.id, partnerCode.toUpperCase());
      if ("error" in result) {
        setError(result.error);
      } else {
        onLinked(result.user);
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
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
            Ola, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Vamos conectar voce com seu amor
          </p>
        </div>

        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-serif text-xl flex items-center justify-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Seu Codigo de Casal
            </CardTitle>
            <CardDescription>
              Compartilhe este codigo com seu amor para se conectarem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary rounded-lg p-4 text-center">
                <span className="font-mono text-2xl font-bold tracking-widest text-foreground">
                  {user.coupleCode}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopy}
                className="h-14 w-14"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <CopyIcon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-serif text-xl">
              Conectar com Parceiro(a)
            </CardTitle>
            <CardDescription>
              Ou insira o codigo que seu amor compartilhou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLink}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="partnerCode">Codigo do Parceiro(a)</FieldLabel>
                  <Input
                    id="partnerCode"
                    type="text"
                    placeholder="Ex: ABC123"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="bg-secondary/50 text-center font-mono text-lg tracking-widest uppercase"
                  />
                </Field>
              </FieldGroup>

              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-lg mt-4">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full mt-4" 
                size="lg"
                disabled={isLoading || partnerCode.length < 6}
              >
                {isLoading ? "Conectando..." : "Conectar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
