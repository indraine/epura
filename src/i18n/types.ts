export type Locale = {
    localeName: string
    app: {
        title: string
        titleShort: string
        subtitle: string
        subtitleShort: string
        workspaceParams: string
        workspaceResults: string
        workspaceTabsLabel: string
    }
    about: {
        title: string
        buttonTitle: string
        description: string[]
        author: string
        github: string
        close: string
    }
    form: {
        requiredFieldError: string
        deleteButton: string
        itemsCount: string
        coordRangeError: string
        exportTitle: string
        exportButton: string
        importTitle: string
        importButton: string
        calculateButton: string
        mainParams: string
        sectionCalculator: {
            title: string
            button: string
            description: string
            subtitle: string
            apply: string
            cancel: string
            dimensions: string
            presets: string
            areaA: string
            inertiaIz: string
            sectionModulusWz: string
            gyrationIz: string
            tube: string
            manual: string
        }
        sections: {
            label: string
            errorMin: string
            errorMax: string
        }
        length: {
            label: string
            error: string
        }
        quality: {
            label: string
            errorMin: string
            errorMax: string
        }
        young: {
            label: string
            error: string
        }
        density: {
            label: string
            error: string
        }
        solverMethod: {
            label: string
            options: {
                cholesky: string
                lu: string
                qr: string
                sparselu: string
            }
        }
        bind: {
            label: string
        }
        boundaryConditions: {
            title: string
            addTitle: string
            itemLabel: string
            empty: string
            type: {
                label: string
                seal: string
                hindle: string
            }
            coord: {
                label: string
            }
            deleteTitle: string
            coordOccupiedError: string
        }
        pointLoads: {
            title: string
            addTitle: string
            itemLabel: string
            empty: string
            coord: {
                label: string
            }
            value: {
                label: string
            }
            coordOccupiedError: string
        }
        distributedLoads: {
            title: string
            addTitle: string
            itemLabel: string
            empty: string
            start: {
                label: string
            }
            end: {
                label: string
            }
            value: {
                label: string
            }
            endCoordError: string
        }
        close: string
    }
    sectionCalculator: {
        manual: string
        rectangle: string
        circle: string
        ring: string
        iBeam: string
        inertia: {
            label: string
        }
        area: {
            label: string
        }
        rectangle_b: {
            label: string
        }
        rectangle_h: {
            label: string
        }
        circle_d: {
            label: string
        }
        ring_D: {
            label: string
        }
        ring_d: {
            label: string
        }
        ibeam_h: {
            label: string
        }
        ibeam_b: {
            label: string
        }
        ibeam_tw: {
            label: string
        }
        ibeam_tf: {
            label: string
        }
        result: {
            inertia: string
            area: string
        }
    }
    plots: {
        results: string
        stressState: {
            title: string
            nodes: string
            deflection: string
        }
        modes: {
            title: string
        }
        shearForce: {
            title: string
        }
        bendingMoment: {
            title: string
        }
        history: {
            title: string
            settings: string
            maxCalculations: {
                label: string
            }
        }
    }
    settings: {
        title: string
        mode: {
            label: string
            auto: string
            manual: string
            autoDescription: string
            manualDescription: string
        }
    }
    tour: {
        welcome: {
            title: string
            description: string
            start: string
        }
        form: {
            title: string
            description: string
            prev: string
            next: string
        }
        plots: {
            title: string
            description: string
            prev: string
            next: string
        }
        settings: {
            title: string
            description: string
            prev: string
            next: string
        }
        theme: {
            title: string
            description: string
            prev: string
            next: string
        }
        complete: {
            title: string
            description: string
            close: string
        }
        stepCounter: string
    }
}
