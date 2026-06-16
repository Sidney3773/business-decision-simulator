import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../components/layout/AdminDashboard';
import TeacherDashboard from '../components/layout/TeacherDashboard';
import StudentDashboard from '../components/layout/StudentDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':   return <AdminDashboard />;
    case 'TEACHER': return <TeacherDashboard />;
    case 'STUDENT': return <StudentDashboard />;
    default:
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Rol no reconocido: {user?.role}</h2>
        </div>
      );
  }
};

export default Dashboard;