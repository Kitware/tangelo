import vtk

def initialize(self, VTKWebApp, args):
    if not VTKWebApp.view:
        # VTK specific code
        renderer = vtk.vtkRenderer()
        renderWindow = vtk.vtkRenderWindow()
        renderWindow.AddRenderer(renderer)

        renderWindowInteractor = vtk.vtkRenderWindowInteractor()
        renderWindowInteractor.SetRenderWindow(renderWindow)
        renderWindowInteractor.GetInteractorStyle().SetCurrentStyleToTrackballCamera()

        cone = vtk.vtkConeSource()
        mapper = vtk.vtkPolyDataMapper()
        actor = vtk.vtkActor()

        mapper.SetInputConnection(cone.GetOutputPort())
        actor.SetMapper(mapper)

        renderer.AddActor(actor)
        renderer.ResetCamera()
        renderWindow.Render()

        # VTK Web application specific
        VTKWebApp.view = renderWindow
        self.Application.GetObjectIdMap().SetActiveObject("VIEW", renderWindow)
