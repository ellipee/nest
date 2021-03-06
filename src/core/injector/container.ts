import 'reflect-metadata';
import { Controller, Injectable } from '@nestjs/common/interfaces';
import { NestModuleMetatype } from '@nestjs/common/interfaces/modules/module-metatype.interface';
import { Metatype } from '@nestjs/common/interfaces/metatype.interface';
import { SHARED_MODULE_METADATA } from '@nestjs/common/constants';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { Module } from './module';
import { UnknownModuleException } from '../errors/exceptions/unknown-module.exception';
import { ModuleTokenFactory } from './module-token-factory';

export class NestContainer {
    private readonly modules = new Map<string, Module>();
    private readonly moduleTokenFactory = new ModuleTokenFactory();

    public addModule(metatype: NestModuleMetatype, scope: NestModuleMetatype[]) {
        const token = this.moduleTokenFactory.create(metatype, scope);
        if (this.modules.has(token)) {
            return;
        }
        this.modules.set(token, new Module(metatype, scope));
    }

    public getModules(): Map<string, Module> {
        return this.modules;
    }

    public addRelatedModule(relatedModule: NestModuleMetatype, token: string) {
        if (!this.modules.has(token)) return;

        const module = this.modules.get(token);
        const parent = module.metatype;

        const relatedModuleToken = this.moduleTokenFactory.create(
            relatedModule,
            [].concat(module.scope, parent),
        );
        const related = this.modules.get(relatedModuleToken);
        module.addRelatedModule(related);
    }

    public addComponent(component: Metatype<Injectable>, token: string) {
        if (!this.modules.has(token)) {
            throw new UnknownModuleException();
        }
        const module = this.modules.get(token);
        module.addComponent(component);
    }

    public addExportedComponent(exportedComponent: Metatype<Injectable>, token: string) {
        if (!this.modules.has(token)) {
            throw new UnknownModuleException();
        }
        const module = this.modules.get(token);
        module.addExportedComponent(exportedComponent);
    }

    public addController(controller: Metatype<Controller>, token: string) {
        if (!this.modules.has(token)) {
            throw new UnknownModuleException();
        }
        const module = this.modules.get(token);
        module.addRoute(controller);
    }

    public clear() {
        this.modules.clear();
    }

}

export interface InstanceWrapper<T> {
    name: any;
    metatype: Metatype<T>;
    instance: T;
    isResolved: boolean;
    inject?: Metatype<any>[];
    isNotMetatype?: boolean;
}