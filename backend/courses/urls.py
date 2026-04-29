from django.urls import path
from . import views

urlpatterns = [
    path('', views.cursos_list, name='cursos-list'),
    path('matriculas/', views.matriculas_list, name='matriculas-list'),
    path('actividades/plantillas/', views.mis_plantillas, name='plantillas-list'),
    path('actividades/<int:pk>/', views.actividad_detail, name='actividad-detail'),
    path('notas/', views.guardar_nota, name='guardar-nota'),
    path('<int:pk>/', views.curso_detail, name='curso-detail'),
    path('<int:pk>/estudiantes/', views.curso_estudiantes, name='curso-estudiantes'),
    path('<int:pk>/actividades/', views.curso_actividades, name='curso-actividades'),
    path('<int:pk>/actividades/<int:plantilla_pk>/usar-plantilla/', views.usar_plantilla, name='usar-plantilla'),
    path('<int:pk>/actividades/<int:pk2>/guardar-plantilla/', views.guardar_plantilla, name='guardar-plantilla'),
    path('<int:pk>/asistencia/', views.asistencia_curso, name='asistencia-curso'),
    path('<int:pk>/asistencia/bulk/', views.registrar_asistencia_bulk, name='asistencia-bulk'),
    path('<int:pk>/resumen-asistencia/', views.resumen_asistencia, name='resumen-asistencia'),
    path('<int:pk>/centro-notas/', views.centro_notas, name='centro-notas'),
]
