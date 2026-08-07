import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../AppContext';
import ProjectDetails from '../../components/ProjectDetails';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';

export const OpsProjectPage: React.FC = () => {
  const { id } = useParams();
  const { projects } = useApp();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <EmptyState
        title="Projeto não encontrado"
        action={
          <Button variant="soft" onClick={() => navigate('/projetos')}>
            Voltar
          </Button>
        }
      />
    );
  }

  return <ProjectDetails project={project} onBack={() => navigate(`/projetos`)} />;
};
