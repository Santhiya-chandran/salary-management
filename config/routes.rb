Rails.application.routes.draw do
  resource :session, only: %i[ new create destroy ]

  namespace :api, defaults: { format: :json } do
    resources :employees, only: %i[ index show create update destroy ] do
      # A collection route, so Rails matches it before /employees/:id.
      get :filters, on: :collection, to: "employee_filters#show"
    end

    scope :insights, controller: :insights, as: :insights do
      get :by_country
      get :by_job_title
      get :headcount
      get :usd_comparison
    end
  end
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  root "home#index"

  # Pages handled by React Router in the browser. Rails serves the same app
  # shell for them so a refresh or bookmark works. Listed explicitly rather
  # than as a catch-all, so unknown URLs still 404.
  get "employees(/*rest)", to: "home#index", as: :employees_page
  get "insights(/*rest)", to: "home#index", as: :insights_page
end
